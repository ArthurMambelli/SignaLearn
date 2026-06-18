const questions = [
  {
    question: "O que significa este sinal em Libras?",
    subtitle: "Observe o gesto e escolha a opção correta",
    sign: "🖐️",
    signLabel: "Mão aberta, movida para cima próxima ao rosto",
    options: ["Olá / Oi", "Tchau", "Obrigado", "Desculpa"],
    correct: 0,
    explanation: "Este é o sinal de 'Olá' em Libras — mão aberta movida para cima, próxima ao rosto."
  },
  {
    question: "Qual sinal representa 'Obrigado'?",
    subtitle: "Identifique o sinal correto",
    sign: "🤜",
    signLabel: "Mão fechada partindo do queixo em direção à pessoa",
    options: ["Sim", "Obrigado", "Não", "Por favor"],
    correct: 1,
    explanation: "'Obrigado' em Libras: mão fechada que parte do queixo em direção à outra pessoa."
  },
  {
    question: "Como se faz 'Bom dia' em Libras?",
    subtitle: "Observe e identifique o sinal",
    sign: "☀️",
    signLabel: "Mão direita aberta, movendo-se da direita para o centro",
    options: ["Boa noite", "Bom dia", "Boa tarde", "Até logo"],
    correct: 1,
    explanation: "'Bom dia': mão vai do lado direito ao centro, imitando o nascer do sol."
  },
  {
    question: "O que significa o sinal representado?",
    subtitle: "Escolha a tradução correta para Libras",
    sign: "🤞",
    signLabel: "Mão com dedo indicador e médio cruzados, movida lateralmente",
    options: ["Tchau", "Com licença", "Sim", "Não"],
    correct: 1,
    explanation: "'Com licença' em Libras é feito com este gesto lateral — muito usado no cotidiano!"
  }
];

let currentQ = 0;
let answered = false;
let correctCount = 0;
let hearts = 3;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  const targetScreen = document.getElementById('screen-' + id);

  if (targetScreen) {
    targetScreen.classList.add('active');
  }

  updateNavButtons(id);
}

function updateNavButtons(activeScreen) {
  document.querySelectorAll('.nav-btn').forEach(button => {
    button.classList.remove('active');
  });

  document.querySelectorAll('.bottom-nav').forEach(nav => {
    const buttons = nav.querySelectorAll('.nav-btn');

    buttons.forEach(button => {
      const onclickValue = button.getAttribute('onclick');

      if (onclickValue && onclickValue.includes(`showScreen('${activeScreen}')`)) {
        button.classList.add('active');
      }
    });
  });
}

function goToLesson() {
  currentQ = 0;
  answered = false;
  correctCount = 0;
  hearts = 3;

  showScreen('lesson');
  renderQuestion();
}

function renderQuestion() {
  const q = questions[currentQ];
  const progress = Math.round((currentQ / questions.length) * 100);

  document.getElementById('xp-bar').style.width = progress + '%';

  document.getElementById('hearts').textContent =
    '❤️'.repeat(hearts) + '🖤'.repeat(Math.max(0, 3 - hearts));

  document.getElementById('lesson-body').innerHTML = `
    <div class="lesson-question">${q.question}</div>
    <div class="lesson-subtitle">${q.subtitle}</div>

    <div class="sign-display">
      <span class="sign-emoji">${q.sign}</span>
      <div class="sign-label">${q.signLabel}</div>
    </div>

    <div class="options-grid">
      ${q.options.map((option, index) => `
        <button class="option-btn" id="opt-${index}" onclick="answer(${index})">
          ${option}
        </button>
      `).join('')}
    </div>

    <div class="feedback-bar" id="feedback"></div>

    <button class="continue-lesson-btn" id="cont-btn" onclick="nextQuestion()">
      Continuar →
    </button>
  `;

  answered = false;
}

function answer(idx) {
  if (answered) return;

  answered = true;

  const q = questions[currentQ];
  const isCorrect = idx === q.correct;

  document.querySelectorAll('.option-btn').forEach(button => {
    button.disabled = true;
  });

  const selectedOption = document.getElementById('opt-' + idx);
  const correctOption = document.getElementById('opt-' + q.correct);

  selectedOption.classList.add(isCorrect ? 'correct' : 'wrong');

  if (!isCorrect) {
    correctOption.classList.add('correct');

    hearts = Math.max(0, hearts - 1);

    document.getElementById('hearts').textContent =
      '❤️'.repeat(hearts) + '🖤'.repeat(3 - hearts);
  } else {
    correctCount++;
  }

  const feedback = document.getElementById('feedback');
  const continueButton = document.getElementById('cont-btn');

  feedback.className = 'feedback-bar show ' + (isCorrect ? 'correct' : 'wrong');

  if (isCorrect) {
    feedback.innerHTML = `
      <div class="feedback-title">Excelente! +7 XP ⚡</div>
      <div class="feedback-text">${q.explanation}</div>
    `;
  } else {
    feedback.innerHTML = `
      <div class="feedback-title">Quase lá! Continue tentando.</div>
      <div class="feedback-text">${q.explanation}</div>
    `;
  }

  continueButton.style.display = 'block';
}

function nextQuestion() {
  currentQ++;

  if (currentQ >= questions.length) {
    document.getElementById('xp-bar').style.width = '100%';

    const accuracy = Math.round((correctCount / questions.length) * 100);

    document.getElementById('accuracy-label').textContent = accuracy + '%';

    setTimeout(() => {
      showScreen('result');
    }, 400);
  } else {
    renderQuestion();
  }
}