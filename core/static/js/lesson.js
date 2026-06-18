const lessonBody = document.getElementById('lesson-body');
const xpBar = document.getElementById('xp-bar');
const heartsEl = document.getElementById('hearts');

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// ─── detecta se "sign" é URL de mídia ou emoji ───
function isMedia(sign) {
  return typeof sign === 'string' && (
    sign.startsWith('/') || sign.startsWith('http') ||
    /\.(mp4|webm|mov|jpg|jpeg|png|gif|webp)$/i.test(sign)
  );
}
function isVideo(sign) {
  return /\.(mp4|webm|mov)$/i.test(sign);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeJsString(value) {
  return String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"');
}

// ─── bloco de sinal: emoji, imagem ou vídeo ───
function renderSignBlock(sign, signLabel) {
  const safeLabelHtml = escapeHtml(signLabel);
  const safeLabelJs = escapeJsString(signLabel);
  const safeSignJs = escapeJsString(sign);

  if (!isMedia(sign)) {
    return `
      <div class="sign-display">
        <span class="sign-emoji">${escapeHtml(sign)}</span>
        <div class="sign-label">${safeLabelHtml}</div>
      </div>`;
  }

  if (isVideo(sign)) {
    return `
      <div class="sign-display sign-media-display" onclick="openSignModal('${safeSignJs}','${safeLabelJs}',true)" title="Clique para ampliar">
        <div class="sign-media-wrapper sign-video-wrapper">
          <video
            class="sign-video-thumb"
            src="${sign}"
            muted
            loop
            autoplay
            playsinline
            preload="metadata"
          ></video>

          <div class="sign-media-overlay">
            <span class="sign-expand-icon">⛶</span>
          </div>
        </div>

        <div class="sign-label">${safeLabelHtml}</div>
        <div class="sign-click-hint">Clique para ampliar</div>
      </div>`;
  }

  return `
    <div class="sign-display sign-media-display" onclick="openSignModal('${safeSignJs}','${safeLabelJs}',false)" title="Clique para ampliar">
      <div class="sign-media-wrapper sign-image-wrapper">
        <img class="sign-image-thumb" src="${sign}" alt="${safeLabelHtml}" />

        <div class="sign-media-overlay">
          <span class="sign-expand-icon">⛶</span>
        </div>
      </div>

      <div class="sign-label">${safeLabelHtml}</div>
      <div class="sign-click-hint">Clique para ampliar</div>
    </div>`;
}

// ─── modal com player próprio ───
function openSignModal(src, label, isVideoFile) {
  const existing = document.getElementById('sign-modal');
  if (existing) existing.remove();

  const safeLabel = escapeHtml(label);

  const mediaHtml = isVideoFile
    ? `
      <div class="custom-video-player">
        <video
          id="sign-modal-video"
          src="${src}"
          autoplay
          loop
          muted
          playsinline
          preload="metadata"
        ></video>

        <div class="custom-video-controls">
          <button type="button" class="video-control-btn" id="video-play-btn">⏸</button>

          <input
            type="range"
            id="video-progress"
            class="video-progress"
            min="0"
            max="100"
            value="0"
            step="0.1"
          >

          <span class="video-time" id="video-time">0:00</span>
        </div>
      </div>`
    : `<img id="sign-modal-img" src="${src}" alt="${safeLabel}" />`;

  const modal = document.createElement('div');
  modal.id = 'sign-modal';
  modal.innerHTML = `
    <div class="sign-modal-backdrop" onclick="closeSignModal()"></div>

    <div class="sign-modal-content">
      <button type="button" class="sign-modal-close" onclick="closeSignModal()">✕</button>

      <div class="sign-modal-media">
        ${mediaHtml}
      </div>

      <div class="sign-modal-label">${safeLabel}</div>
    </div>`;

  document.body.appendChild(modal);

  requestAnimationFrame(() => modal.classList.add('sign-modal-visible'));

  if (isVideoFile) {
    setupCustomVideoControls();
  }
}

function setupCustomVideoControls() {
  const video = document.getElementById('sign-modal-video');
  const playBtn = document.getElementById('video-play-btn');
  const progress = document.getElementById('video-progress');
  const time = document.getElementById('video-time');

  if (!video || !playBtn || !progress || !time) return;

  video.muted = true;
  video.volume = 0;

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');

    return `${minutes}:${secs}`;
  }

  function updateProgress() {
    if (!video.duration) return;

    progress.value = (video.currentTime / video.duration) * 100;
    time.textContent = formatTime(video.currentTime);
  }

  playBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      playBtn.textContent = '⏸';
    } else {
      video.pause();
      playBtn.textContent = '▶';
    }
  });

  video.addEventListener('click', () => {
    playBtn.click();
  });

  video.addEventListener('timeupdate', updateProgress);

  video.addEventListener('loadedmetadata', () => {
    time.textContent = formatTime(video.currentTime);
  });

  progress.addEventListener('input', () => {
    if (!video.duration) return;

    video.currentTime = (progress.value / 100) * video.duration;
  });
}

function closeSignModal() {
  const modal = document.getElementById('sign-modal');

  if (!modal) return;

  const video = document.getElementById('sign-modal-video');
  if (video) video.pause();

  modal.classList.remove('sign-modal-visible');

  setTimeout(() => modal.remove(), 250);
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSignModal(); });

// ─────────────────────────────────────────────────────────────
//  DADOS DAS LIÇÕES
//  "sign" pode ser:
//    emoji  →  '🤏'
//    imagem →  '/static/media/libras/alfa_c.jpg'
//    vídeo  →  '/static/media/libras/alfa_c.jpg'
// ─────────────────────────────────────────────────────────────
const LESSONS = {
  alfabeto: {
    title: 'Alfabeto em Libras',
    subtitle: 'Observe o sinal exibido e escolha a letra correspondente.',
    questions: [
      {
        type: 'recognition',
        question: 'Qual letra este sinal representa?',
        sign: '/static/media/libras/alfa_c.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['A', 'C', 'E', 'B'],
        answer: 'C',
        explanation: 'Este sinal representa a letra C.'
      },
      {
        type: 'recognition',
        question: 'Qual letra este sinal representa?',
        sign: '/static/media/libras/alfa_e.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['C', 'E', 'A', 'D'],
        answer: 'E',
        explanation: 'Este sinal representa a letra E.'
      },
      {
        type: 'recognition',
        question: 'Qual letra este sinal representa?',
        sign: '/static/media/libras/alfa_b.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['D', 'A', 'B', 'E'],
        answer: 'B',
        explanation: 'Este sinal representa a letra B.'
      },
      {
        type: 'review',
        question: 'Revisão final: qual letra este sinal representa?',
        sign: '/static/media/libras/alfa_a.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['B', 'A', 'D', 'C'],
        answer: 'A',
        explanation: 'Este sinal representa a letra A.'
      },
      {
        type: 'recognition',
        question: 'Qual letra este sinal representa?',
        sign: '/static/media/libras/alfa_d.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['A', 'D', 'B', 'E'],
        answer: 'D',
        explanation: 'Este sinal representa a letra D.'
      },
    ]
  },

  numeros: {
    title: 'Números em Libras',
    subtitle: 'Observe o sinal exibido e escolha o número correspondente.',
    questions: [
      {
        type: 'recognition',
        question: 'Qual número este sinal representa?',
        sign: '/static/media/libras/num_2.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['4', '2', '0', '5'],
        answer: '2',
        explanation: 'Este sinal representa o número 2.'
      },
      {
        type: 'recognition',
        question: 'Qual número este sinal representa?',
        sign: '/static/media/libras/num_5.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['5', '2', '0', '4'],
        answer: '5',
        explanation: 'Este sinal representa o número 5.'
      },
      {
        type: 'recognition',
        question: 'Qual número este sinal representa?',
        sign: '/static/media/libras/num_0.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['3', '0', '1', '2'],
        answer: '0',
        explanation: 'Este sinal representa o número 0.'
      },
      {
        type: 'recognition',
        question: 'Qual número este sinal representa?',
        sign: '/static/media/libras/num_3.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['1', '4', '3', '5'],
        answer: '3',
        explanation: 'Este sinal representa o número 3.'
      },
      {
        type: 'recognition',
        question: 'Qual número este sinal representa?',
        sign: '/static/media/libras/num_1.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['2', '1', '4', '0'],
        answer: '1',
        explanation: 'Este sinal representa o número 1.'
      },
      {
        type: 'review',
        question: 'Revisão final: qual número este sinal representa?',
        sign: '/static/media/libras/num_4.jpg',
        signLabel: 'Observe o sinal exibido',
        options: ['5', '2', '4', '1'],
        answer: '4',
        explanation: 'Este sinal representa o número 4.'
      }
    ]
  },

  saudacoes: {
    title: 'Cumprimentos e Saudações',
    subtitle: 'Observe o gesto e escolha a alternativa correta.',
    questions: [
      {
        type: 'recognition',
        question: 'O que significa este sinal em Libras?',
        sign: '/static/media/libras/saud_ola.mp4',
        signLabel: 'Mão aberta próxima ao rosto, com movimento lateral',
        options: ['Olá / Oi', 'Tchau', 'Obrigado', 'Desculpa'],
        answer: 'Olá / Oi',
        explanation: 'Este é o sinal de Olá/Oi em Libras, usado como saudação inicial.'
      },
      {
        type: 'recognition',
        question: 'O que significa este sinal em Libras?',
        sign: '/static/media/libras/saud_obrigado.mp4',
        signLabel: 'Mão fechada partindo da testa em direção à pessoa',
        options: ['Sim', 'Obrigado', 'Não', 'Por favor'],
        answer: 'Obrigado',
        explanation: 'Obrigado em Libras pode ser representado por um movimento que parte da região da testa em direção à pessoa.'
      },
      {
        type: 'recognition',
        question: 'O que significa este sinal em Libras?',
        sign: '/static/media/libras/saud_bomdia.mp4',
        signLabel: 'Movimento com a mão à frente do corpo, seguido de trajetória ascendente',
        options: ['Boa noite', 'Bom dia', 'Boa tarde', 'Até logo'],
        answer: 'Bom dia',
        explanation: 'Bom dia é associado a um movimento que representa o nascer do dia.'
      },
      {
        type: 'recognition',
        question: 'O que significa o sinal representado?',
        sign: '/static/media/libras/saud_comlicenca.mp4',
        signLabel: 'Mão com dedo indicador e médio cruzados, movida lateralmente',
        options: ['Tchau', 'Com licença', 'Sim', 'Não'],
        answer: 'Com licença',
        explanation: 'Com licença é um sinal útil em interações do cotidiano.'
      }
    ]
  }
};

// ─────────────────────────────────────────────────────────────

const lesson = LESSONS[lessonSlug];

if (!lesson) {
  lessonBody.innerHTML = `
    <div class="lesson-question">Nível ainda não disponível</div>
    <div class="lesson-subtitle">Este conteúdo ainda está em desenvolvimento.</div>
    <div class="sign-display">
      <span class="sign-emoji">🔒</span>
      <div class="sign-label">Volte para o caminho de aprendizado e continue pelos níveis disponíveis.</div>
    </div>
    <a href="/" class="home-btn">Voltar ao início</a>`;
  throw new Error(`Lição não encontrada: ${lessonSlug}`);
}

let currentQuestionIndex = 0;
let correctAnswers = 0;
let hearts = 3;
let answered = false;

renderQuestion();

function renderQuestion() {
  answered = false;
  const question = lesson.questions[currentQuestionIndex];
  const progress = (currentQuestionIndex / lesson.questions.length) * 100;
  xpBar.style.width = `${progress}%`;
  heartsEl.textContent = '❤️'.repeat(hearts);
  renderRecognitionQuestion(question);
}

function renderRecognitionQuestion(question) {
  const shuffledOptions = shuffleArray(question.options);

  lessonBody.innerHTML = `
    <div class="lesson-question">${question.question}</div>
    <div class="lesson-subtitle">${lesson.subtitle}</div>

    ${renderSignBlock(question.sign, question.signLabel)}

    <div class="options-grid">
      ${shuffledOptions.map(option => `
        <button class="option-btn" data-answer="${option}">${option}</button>
      `).join('')}
    </div>

    <div class="feedback-bar" id="feedback-bar">
      <div class="feedback-title" id="feedback-title"></div>
      <div class="feedback-text" id="feedback-text"></div>
    </div>

    <button class="continue-lesson-btn" id="continue-btn">Continuar</button>`;

  bindAnswerButtons(question);
}

function bindAnswerButtons(question) {
  const buttons = document.querySelectorAll('.option-btn');
  const continueBtn = document.getElementById('continue-btn');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const selectedAnswer = button.dataset.answer;
      const isCorrect = selectedAnswer === question.answer;

      if (isCorrect) {
        correctAnswers++;
        button.classList.add('correct');
      } else {
        hearts--;
        button.classList.add('wrong');
        buttons.forEach(btn => {
          if (btn.dataset.answer === question.answer) btn.classList.add('correct');
        });
      }

      buttons.forEach(btn => { btn.disabled = true; });
      showFeedback(isCorrect, question.explanation);
      continueBtn.style.display = 'block';
    });
  });

  continueBtn.addEventListener('click', goToNextQuestion);
}

function showFeedback(isCorrect, explanation) {
  const feedbackBar = document.getElementById('feedback-bar');
  const feedbackTitle = document.getElementById('feedback-title');
  const feedbackText = document.getElementById('feedback-text');

  feedbackBar.classList.add('show');
  if (isCorrect) {
    feedbackBar.classList.add('correct');
    feedbackTitle.textContent = 'Muito bem!';
  } else {
    feedbackBar.classList.add('wrong');
    feedbackTitle.textContent = 'Quase!';
  }
  feedbackText.textContent = explanation;
  heartsEl.textContent = hearts > 0 ? '❤️'.repeat(hearts) : '💔';
}

function goToNextQuestion() {
  currentQuestionIndex++;
  if (hearts <= 0 || currentQuestionIndex >= lesson.questions.length) {
    finishLesson();
    return;
  }
  renderQuestion();
}

function finishLesson() {
  xpBar.style.width = '100%';
  const accuracy = Math.round((correctAnswers / lesson.questions.length) * 100);
  window.location.href = `${resultUrl}?accuracy=${accuracy}`;
}
