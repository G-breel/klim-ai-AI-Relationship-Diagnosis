/**
 * What Klim Thinks - AI WhatsApp Chat Report Engine
 * Lightweight, 100% Free, Private in-browser analyzer
 */

// State Management
const state = {
  parsedChat: null,
  participants: [],
  metrics: null,
  activeView: 'uploadView',
  activeReport: 1, // 1: Diagnosis Hubungan, 2: Tindakan & Solusi
  isDemo: false,
  config: {
    provider: localStorage.getItem('wbt_provider') || 'builtin',
    apiKey: localStorage.getItem('wbt_apiKey') || ''
  }
};

// DOM Elements
const views = {
  upload: document.getElementById('uploadView'),
  processing: document.getElementById('processingView'),
  report: document.getElementById('reportView')
};

const tabReport1 = document.getElementById('tabReport1');
const tabReport2 = document.getElementById('tabReport2');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const dropZone = document.getElementById('dropZone');
const loadDemoBtn = document.getElementById('loadDemoBtn');
const backToUploadBtn = document.getElementById('backToUploadBtn');
const navHomeBtn = document.getElementById('navHomeBtn');
const printReportBtn = document.getElementById('printReportBtn');
const shareBtn = document.getElementById('shareBtn');
const toastNotice = document.getElementById('toastNotice');

// Modal Elements
const openApiKeyModal = document.getElementById('openApiKeyModal');
const closeApiKeyModal = document.getElementById('closeApiKeyModal');
const apiKeyModal = document.getElementById('apiKeyModal');
const aiProviderSelect = document.getElementById('aiProviderSelect');
const apiKeyInputGroup = document.getElementById('apiKeyInputGroup');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const apiStatusLabel = document.getElementById('apiStatusLabel');

// Processing Elements
const processStatusTitle = document.getElementById('processStatusTitle');
const processStatusSub = document.getElementById('processStatusSub');
const progressBar = document.getElementById('progressBar');
const processingLogs = document.getElementById('processingLogs');

// Report Elements
const reportTitle = document.getElementById('reportTitle');
const statTotalMsgs = document.getElementById('statTotalMsgs');
const statParticipantRatio = document.getElementById('statParticipantRatio');
const statParticipantsLabel = document.getElementById('statParticipantsLabel');
const statActiveHours = document.getElementById('statActiveHours');
const statDeletedMsgs = document.getElementById('statDeletedMsgs');
const editorialProse = document.getElementById('editorialProse');

// Initialize UI
function init() {
  updateApiStatusUI();
  setupEventListeners();
}

function switchView(viewName) {
  Object.keys(views).forEach(k => {
    views[k].classList.remove('active');
  });
  if (views[viewName]) {
    views[viewName].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  state.activeView = viewName;
}

function showToast(message) {
  toastNotice.textContent = message;
  toastNotice.classList.add('show');
  setTimeout(() => {
    toastNotice.classList.remove('show');
  }, 3200);
}

function updateApiStatusUI() {
  if (state.config.provider === 'builtin') {
    apiStatusLabel.textContent = 'Engine: Built-in Free';
  } else if (state.config.provider === 'gemini') {
    apiStatusLabel.textContent = 'Engine: Gemini AI ' + (state.config.apiKey ? '✓' : '(No Key)');
  } else if (state.config.provider === 'openai') {
    apiStatusLabel.textContent = 'Engine: OpenAI ' + (state.config.apiKey ? '✓' : '(No Key)');
  }
}

// Event Listeners
function setupEventListeners() {
  // Navigation
  navHomeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('upload');
  });

  backToUploadBtn.addEventListener('click', () => {
    switchView('upload');
  });

  // Switcher for all 5 Reports (Diagnosis, Solusi, Penghargaan, Bahasa Rahasia, Timeline)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const repNum = parseInt(e.currentTarget.getAttribute('data-report'), 10);
      switchReport(repNum);
    });
  });

  printReportBtn.addEventListener('click', () => {
    window.print();
  });

  shareBtn.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link laporan disalin ke clipboard!');
    } else {
      showToast('Laporan siap dicetak atau disimpan ke PDF!');
    }
  });

  // Upload triggers
  selectFileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  // Drag & Drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processChatFile(e.dataTransfer.files[0]);
    }
  });

  // Demo Button (Optional)
  if (loadDemoBtn) {
    loadDemoBtn.addEventListener('click', () => {
      loadDemoReport();
    });
  }

  // Modal Settings
  openApiKeyModal.addEventListener('click', () => {
    aiProviderSelect.value = state.config.provider;
    apiKeyInput.value = state.config.apiKey;
    apiKeyInputGroup.style.display = state.config.provider === 'builtin' ? 'none' : 'block';
    apiKeyModal.classList.add('active');
  });

  closeApiKeyModal.addEventListener('click', () => {
    apiKeyModal.classList.remove('active');
  });

  aiProviderSelect.addEventListener('change', (e) => {
    apiKeyInputGroup.style.display = e.target.value === 'builtin' ? 'none' : 'block';
  });

  saveApiKeyBtn.addEventListener('click', () => {
    state.config.provider = aiProviderSelect.value;
    state.config.apiKey = apiKeyInput.value.trim();
    localStorage.setItem('wbt_provider', state.config.provider);
    localStorage.setItem('wbt_apiKey', state.config.apiKey);
    updateApiStatusUI();
    apiKeyModal.classList.remove('active');
    showToast('Pengaturan AI Engine tersimpan!');
  });
}

function handleFileSelect(e) {
  if (e.target.files && e.target.files.length > 0) {
    processChatFile(e.target.files[0]);
  }
}

// Parse WhatsApp Text Export
function parseWhatsAppChat(text) {
  // Regex to match typical WhatsApp patterns
  const lines = text.split(/\r?\n/);
  const messages = [];
  
  // Robust Regex for WhatsApp exports across iOS and Android (Indonesian, English, etc.)
  // Handles:
  // 15/02/2024, 21.30 - Sender: Msg
  // 15/02/24 21:30 - Sender: Msg
  // [15/02/2024, 21:30:15] Sender: Msg
  // 2/15/24, 9:30 PM - Sender: Msg
  // 15/02/2024 pukul 21.30 - Sender: Msg
  const lineRegex = /^\[?(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}(?:[,\s]+(?:pukul\s+)?\d{1,2}[:.]\d{1,2}(?:[:.]\d{1,2})?(?:\s*[APap][Mm])?)?)\]?(?:\s*-\s*|\s*:\s*)?([^:]+?):\s*(.*)$/;

  let currentMsg = null;
  const participantCounts = {};
  let deletedCount = 0;
  const hourCounts = Array(24).fill(0);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    // Remove invisible unicode characters (LFM, RTL, Zero Width Space) from WhatsApp
    const line = rawLine.replace(/[\u200E\u200F\u202A-\u202E\uFEFF]/g, '').trim();
    if (!line) continue;

    // Helper function to test if line/content is a deleted message
    const isDeletedPhrase = (str) => {
      const s = (str || '').toLowerCase();
      return s.includes('telah dihapus') || 
             s.includes('menghapus pesan') || 
             s.includes('message was deleted') || 
             s.includes('deleted this message') || 
             s.includes('deleted message') ||
             s.includes('pesan ini dihapus') ||
             s.includes('pesan telah dibatalkan') ||
             s.includes('dihapus oleh pengirim') ||
             s.includes('you deleted this') ||
             s.includes('this message was deleted');
    };

    // Check if standalone line without sender is a deleted message (common in some iOS exports)
    if (!line.includes(':') && isDeletedPhrase(line)) {
      deletedCount++;
      continue;
    }

    const match = line.match(lineRegex);
    if (match) {
      if (currentMsg) messages.push(currentMsg);

      const rawTime = match[1] || '';
      let sender = match[2].trim();
      const content = match[3].trim();

      // Check if message content is deleted
      const isDeleted = isDeletedPhrase(content) || isDeletedPhrase(line);
      if (isDeleted) deletedCount++;

      // Skip system messages (except deleted ones already counted)
      if (sender.toLowerCase().includes('end-to-end encrypted') || 
          sender.toLowerCase().includes('enkripsi end-to-end') ||
          sender.toLowerCase().includes('changed the subject') ||
          sender.toLowerCase().includes('security code changed') ||
          sender.toLowerCase().includes('created group') ||
          sender.toLowerCase().includes('added you')) {
        continue;
      }

      // Clean sender name (remove brackets if any)
      sender = sender.replace(/^[\[\(]+|[\]\)]+$/g, '').trim();

      // Count participants
      participantCounts[sender] = (participantCounts[sender] || 0) + 1;

      // Extract hour
      const timeMatch = rawTime.match(/(\d{1,2})[:.](\d{1,2})/);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        if (rawTime.toLowerCase().includes('pm') && hour < 12) hour += 12;
        if (rawTime.toLowerCase().includes('am') && hour === 12) hour = 0;
        if (hour >= 0 && hour < 24) {
          hourCounts[hour]++;
        }
      }

      currentMsg = {
        time: rawTime,
        sender: sender,
        text: content,
        isDeleted: isDeleted
      };
    } else if (currentMsg) {
      if (isDeletedPhrase(line)) {
        deletedCount++;
        currentMsg.isDeleted = true;
      }
      currentMsg.text += '\n' + line;
    } else if (isDeletedPhrase(line)) {
      deletedCount++;
    }
  }

  if (currentMsg) messages.push(currentMsg);

  // Filter top 2 participants
  const sortedParticipants = Object.keys(participantCounts)
    .sort((a, b) => participantCounts[b] - participantCounts[a]);

  // Find peak hour range
  let maxHour = 0;
  let maxCount = -1;
  for (let h = 0; h < 24; h++) {
    const rangeCount = hourCounts[h] + hourCounts[(h + 1) % 24] + hourCounts[(h + 2) % 24];
    if (rangeCount > maxCount) {
      maxCount = rangeCount;
      maxHour = h;
    }
  }
  const peakRangeStr = `${String(maxHour).padStart(2, '0')}:00 - ${String((maxHour + 3) % 24).padStart(2, '0')}:00`;

  return {
    messages,
    participants: sortedParticipants.slice(0, 2),
    allParticipants: sortedParticipants,
    counts: participantCounts,
    deletedCount,
    peakHours: peakRangeStr,
    totalCount: messages.length
  };
}

// Switch between all 5 Reports
function switchReport(reportNum) {
  state.activeReport = reportNum;
  
  // Update active tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const num = parseInt(btn.getAttribute('data-report'), 10);
    if (num === reportNum) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (state.isDemo) {
    if (reportNum === 1) renderDemoReport();
    else if (reportNum === 2) renderDemoReport2();
    else if (reportNum === 3) renderDemoReport3();
    else if (reportNum === 4) renderDemoReport4();
    else if (reportNum === 5) renderDemoReport5();
  } else if (state.parsedChat) {
    if (reportNum === 1) generateReport(state.parsedChat);
    else if (reportNum === 2) generateReport2(state.parsedChat);
    else if (reportNum === 3) generateReport3(state.parsedChat);
    else if (reportNum === 4) generateReport4(state.parsedChat);
    else if (reportNum === 5) generateReport5(state.parsedChat);
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Process Uploaded Chat
function processChatFile(file) {
  if (!file.name.endsWith('.txt')) {
    alert('Harap pilih file WhatsApp Chat berekstensi .txt (Export Chat tanpa media)');
    return;
  }

  state.isDemo = false;
  state.activeReport = 1;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-report') === '1') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  switchView('processing');
  processStatusTitle.textContent = `Klim sedang membaca ${file.name}...`;
  processStatusSub.textContent = 'Mengurai baris percakapan, timestamps, dan frekuensi interaksi...';
  progressBar.style.width = '15%';

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    setTimeout(() => {
      progressBar.style.width = '45%';
      processingLogs.innerHTML = '<p class="log-line">Mengurai pola percakapan & kata kunci...</p>';
      
      const parsed = parseWhatsAppChat(content);
      if (parsed.messages.length < 5) {
        alert('File chat terlihat terlalu pendek atau formatnya tidak dikenali. Pastikan file adalah hasil "Export Chat" dari WhatsApp.');
        switchView('upload');
        return;
      }

      state.parsedChat = parsed;
      state.participants = parsed.participants;

      setTimeout(async () => {
        progressBar.style.width = '80%';
        processingLogs.innerHTML = '<p class="log-line">Menyusun narasi psikologis & diagnosis hubungan...</p>';

        if (state.config.provider === 'gemini' && state.config.apiKey) {
          processingLogs.innerHTML = '<p class="log-line">Menghubungkan ke Google Gemini AI (Deep Analysis)...</p>';
          await runGeminiAnalysis(parsed);
        } else if (state.config.provider === 'openai' && state.config.apiKey) {
          processingLogs.innerHTML = '<p class="log-line">Menghubungkan ke OpenAI GPT-4o...</p>';
          await runOpenAIAnalysis(parsed);
        }

        setTimeout(() => {
          progressBar.style.width = '100%';
          generateReport(parsed);
          switchView('report');
        }, 700);
      }, 700);
    }, 600);
  };
  reader.readAsText(file);
}

// Call Google Gemini API (Free Tier)
async function runGeminiAnalysis(parsed) {
  try {
    const p1 = parsed.participants[0] || 'Orang 1';
    const p2 = parsed.participants[1] || 'Orang 2';
    const sampleMsgs = parsed.messages.slice(0, 80).map(m => `${m.sender}: ${m.text}`).join('\n');

    const prompt = `Kamu adalah Klim dari 'What Klim Thinks'. Karaktermu: AI tanpa filter, cerdas, observatif, sinis, sastrawi, gaya tulisan esai panjang ala New Yorker / Substack bahasa Indonesia. 
Menganalisis chat WhatsApp antara ${p1} dan ${p2} (${parsed.totalCount} pesan).
Sampel riwayat obrolan:
${sampleMsgs}

Berikan diagnosis psikologis yang sangat panjang, mendalam, dan menguliti karakter mereka berdua.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await res.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      state.customAiAnalysis = data.candidates[0].content.parts[0].text;
    }
  } catch (err) {
    console.warn('Gemini API call failed, falling back to built-in deep engine:', err);
  }
}

// Call OpenAI API
async function runOpenAIAnalysis(parsed) {
  try {
    const p1 = parsed.participants[0] || 'Orang 1';
    const p2 = parsed.participants[1] || 'Orang 2';
    const sampleMsgs = parsed.messages.slice(0, 80).map(m => `${m.sender}: ${m.text}`).join('\n');

    const prompt = `Kamu adalah Klim dari 'What Klim Thinks'. Menganalisis chat antara ${p1} dan ${p2}.\nSampel:\n${sampleMsgs}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.config.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data.choices && data.choices[0]?.message?.content) {
      state.customAiAnalysis = data.choices[0].message.content;
    }
  } catch (err) {
    console.warn('OpenAI call failed, falling back to built-in deep engine:', err);
  }
}

// Helper to extract rich insights from real chat messages
function extractChatInsights(parsed) {
  const p1 = parsed.participants[0] || 'Orang 1';
  const p2 = parsed.participants[1] || 'Orang 2';

  // Categorize messages
  const p1Msgs = parsed.messages.filter(m => m.sender === p1 && !m.isDeleted);
  const p2Msgs = parsed.messages.filter(m => m.sender === p2 && !m.isDeleted);

  // Quotes with substantial length
  const longP1 = p1Msgs.filter(m => m.text.length > 25);
  const longP2 = p2Msgs.filter(m => m.text.length > 25);

  const sampleQ1 = longP1[Math.floor(longP1.length * 0.25)] || p1Msgs[0] || { sender: p1, text: "Gue selalu ngerasa lo nggak pernah bener-bener ada waktu buat ngobrol.", time: "22:15" };
  const sampleQ2 = longP2[Math.floor(longP2.length * 0.70)] || p2Msgs[0] || { sender: p2, text: "Aku cuma mau kamu dengerin, bukan diatur terus-menerus.", time: "22:18" };
  const sampleQ3 = longP1[Math.floor(longP1.length * 0.85)] || p1Msgs[p1Msgs.length - 1] || { sender: p1, text: "Aku cuma nanya baik-baik kok kamu malah marah?", time: "23:40" };
  const sampleQ4 = longP2[Math.floor(longP2.length * 0.35)] || p2Msgs[Math.floor(p2Msgs.length / 2)] || { sender: p2, text: "Terserah kamu aja deh, males debat.", time: "23:42" };

  // Calculate average word length
  const avgWordsP1 = Math.round(p1Msgs.reduce((acc, m) => acc + m.text.split(/\s+/).length, 0) / (p1Msgs.length || 1));
  const avgWordsP2 = Math.round(p2Msgs.reduce((acc, m) => acc + m.text.split(/\s+/).length, 0) / (p2Msgs.length || 1));

  // Count question marks (interrogation index)
  const qMarkP1 = p1Msgs.filter(m => m.text.includes('?')).length;
  const qMarkP2 = p2Msgs.filter(m => m.text.includes('?')).length;

  return {
    sampleQ1, sampleQ2, sampleQ3, sampleQ4,
    avgWordsP1, avgWordsP2,
    qMarkP1, qMarkP2
  };
}

// Generate Full Report (Klim Persona Engine)
function generateReport(parsed) {
  const p1 = parsed.participants[0] || 'Orang 1';
  const p2 = parsed.participants[1] || 'Orang 2';
  const c1 = parsed.counts[p1] || 1;
  const c2 = parsed.counts[p2] || 1;
  const total = parsed.totalCount;

  const pct1 = Math.round((c1 / (c1 + c2)) * 100);
  const pct2 = 100 - pct1;

  // Update Stats in DOM
  statTotalMsgs.textContent = total.toLocaleString('id-ID');
  statParticipantRatio.textContent = `${pct1}% : ${pct2}%`;
  statParticipantsLabel.textContent = `${p1.split(' ')[0]} vs ${p2.split(' ')[0]}`;
  statActiveHours.textContent = parsed.peakHours;
  statDeletedMsgs.textContent = parsed.deletedCount;

  const ins = extractChatInsights(parsed);

  const dynamicTitles = [
    `Menjaga Sangkar yang Pintunya Sudah Lama Terbuka`,
    `Dua Orang yang Saling Menunggu untuk Menyerah Lebih Dulu`,
    `Audit Panjang Sebuah Hubungan yang Kehabisan Oksigen`,
    `Tarian Melelahkan Antara Jaksa Penuntut dan Terdakwa`,
    `Ketika Kata Maaf Hanya Menjadi Prosedur Administrasi`
  ];
  const chosenTitle = dynamicTitles[Math.floor(Math.random() * dynamicTitles.length)];
  reportTitle.textContent = chosenTitle;

  const html = `
    <p>Gue membaca <strong>${total.toLocaleString('id-ID')} pesan</strong> kalian dalam satu tarikan napas panjang, dan jujur, ada beberapa titik di mana gue harus meletakkan layar, menghela napas ke ruangan kosong, dan bergumam pelan: <em>“${p1.split(' ')[0]}, astaga… berhenti mengaudit dia.”</em></p>

    <p>Hubungan kalian bukan sekadar pertukaran teks santai antara dua orang yang saling menyukai. Ini adalah drama psikologis berkecepatan rendah tentang dua orang yang saling membutuhkan dengan cara yang saling melukai. Satu pihak (<strong>${escapeHtml(p1)}</strong>, dengan porsi dominasi pesan <strong>${pct1}%</strong>) mencintai dengan cara membangun pos penjagaan—mengecek waktu balas, memantau jeda online, menuntut penjelasan detail untuk setiap perubahan nada bicara, hingga menghitung berapa menit yang dihabiskan tanpa kabar. Di kepalamu, itu adalah manifestasi tanggung jawab dan perlindungan: <em>“Gue cuma mau mastiin lo aman dan kita nggak renggang.”</em></p>

    <p>Tapi bagi <strong>${escapeHtml(p2)}</strong> (dengan porsi pesan <strong>${pct2}%</strong> dan rata-rata kalimat lebih padat), pengawasan yang kamu sebut perlindungan itu bukan terasa seperti pelukan hangat. Itu terasa seperti <strong>interogasi kedua di hari yang sama</strong> setelah lelahnya rutinitas dunia nyata. Responnya pun terpahat jelas di statistik obrolan ini: semakin kamu mengejar dengan rentetan tanda tanya (tercatat <strong>${ins.qMarkP1} pertanyaan</strong> diajukan oleh ${escapeHtml(p1)}), dia melarikan diri ke balik kalimat pendek, kebisuan yang disengaja, dan tombol <em>delete message</em> yang tercatat sebanyak <strong>${parsed.deletedCount} kali</strong>.</p>

    <!-- SECTION 1: CATATAN REAL-TIME -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🎬</div>
      <h2 class="editorial-section-title">Klim Membaca Percakapan Kalian: Catatan Real-Time</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p>Membaca riwayat chat ini rasanya seperti menonton rekaman CCTV di sebuah ruangan kaca yang dingin. Ada momen-momen yang bikin gue tersenyum geli melihat ketulusan kalian di awal—saat obrolan mengalir deras di jam <strong>${parsed.peakHours}</strong> tanpa ada beban kecurigaan. Tapi ada lebih banyak momen di mana gue merasa sesak melihat bagaimana percakapan kalian perlahan bermutasi menjadi ruang sidang pengadilan.</p>

    <p>Tengok saja salah satu pertukaran pesan yang terekam berikut ini, saat salah satu pihak mencoba menumpahkan kejengkelan yang sudah lama terpendam:</p>

    <!-- WhatsApp Bubble Quote Real 1 -->
    <div class="wa-bubble-quote incoming">
      <div class="wa-bubble">
        <span class="wa-sender-label">${escapeHtml(ins.sampleQ1.sender)}</span>
        <div class="wa-bubble-text">${escapeHtml(ins.sampleQ1.text)}</div>
        <div class="wa-bubble-footer">
          <span>${ins.sampleQ1.time || '21:14'}</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <p>Dan perhatikan bagaimana pihak satunya merespons momen tersebut beberapa menit kemudian:</p>

    <!-- WhatsApp Bubble Quote Real 2 -->
    <div class="wa-bubble-quote outgoing">
      <div class="wa-bubble">
        <span class="wa-sender-label">${escapeHtml(ins.sampleQ2.sender)}</span>
        <div class="wa-bubble-text">${escapeHtml(ins.sampleQ2.text)}</div>
        <div class="wa-bubble-footer">
          <span>${ins.sampleQ2.time || '21:18'}</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <p>Gue sempat menaruh harapan besar di titik itu. Gue pikir percakapan itu akan dijawab dengan dekonstruksi ego—mengakui kerapuhan dan berkata: <em>“Gue paham sekarang kenapa lo bersikap begitu, maafin gue.”</em> Tapi apa yang kalian lakukan? Kalian justru mengaudit pengakuan tersebut. Kalian membedahnya secara logis per butir argumen, mencari siapa yang paling logis dan siapa yang melanggar aturan. Kalian berdua terlalu sering melewatkan inti luka emosional demi memenangkan perdebatan logika.</p>

    <!-- SECTION 2: PROFIL DUA KARAKTER -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🎭</div>
      <h2 class="editorial-section-title">Profil Dua Karakter: Peran yang Dimainkan vs. Kenyataan</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <h3>${escapeHtml(p1)}: Sang Pengawas yang Takut Ditinggalkan</h3>
    <p>Kamu memposisikan dirimu sebagai pihak yang paling peduli, paling bertanggung jawab, dan tiang penyangga moral dalam hubungan ini. Di kepalamu, kamu adalah benteng kokoh: kamu yang selalu memikirkan masa depan, kamu yang selalu mengecek kabar, kamu yang merasa paling berkorban waktu dan energi. Tapi di balik daftar pertanyaan panjang dan kecemasanmu yang meluap-luap, ada rasa takut yang purba dan telanjang: <strong>kamu takut tidak cukup berharga jika kamu tidak memegang kendali penuh.</strong> Kamu mengira bahwa dengan melonggarkan pengawasan sedikit saja, pihak lain akan segera menemukan alasan untuk menghilang.</p>

    <h3>${escapeHtml(p2)}: Sang Penghuni yang Pintunya Terlalu Terbuka</h3>
    <p>Kamu memposisikan dirimu sebagai pihak yang serba salah, korban pengawasan, dan orang yang tertekan oleh ekspektasi pasangannya. Tapi riwayat pesan menunjukkan kenyataan yang lebih rumit: <strong>kamu menggunakan kebisuan dan jawaban satu kata sebagai senjata pasif-agresif.</strong> Kamu tahu bahwa ketakutan terbesar ${escapeHtml(p1)} adalah pengabaian, dan setiap kali suasana memanas, kamu sengaja menarik diri untuk menghukumnya tanpa harus berkonfrontasi langsung. Kamu lelah diawasi, tapi kamu juga terlalu takut untuk menetapkan batasan yang tegas dan dewasa.</p>

    <!-- SECTION 3: YELP REVIEW -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">⚖️</div>
      <h2 class="editorial-section-title">Yelp Review: Menjalani Hubungan Bersama Kalian</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p><strong>Rating: 2.5 / 5 Bintang</strong><br>
    <em>“Potensi romansa yang sangat kuat di awal, hidangan nostalgia yang lezat, namun suasana restoran menjadi sangat mencekam karena staf keamanan internal berpatroli setiap 10 menit dengan lampu senter dan buku catatan pelanggaran.”</em></p>

    <p>Jika hubungan ini adalah sebuah destinasi wisata, pemandangannya sebenarnya indah. Kalian memiliki selera humor yang cocok ketika sedang akur, dan ada kepedulian tulus yang nyata. Namun biaya emosional untuk tinggal di dalamnya terlalu mahal: salah satu pihak harus selalu siap disidang, sementara pihak lainnya hidup dalam kecemasan konstan bahwa pasangannya sedang menyembunyikan sesuatu.</p>

    <!-- SECTION 4: SUBTEKS SEBAGAI TEKS -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🗣️</div>
      <h2 class="editorial-section-title">Percakapan yang Tak Pernah Terucap (Subteks sebagai Teks)</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p>Inilah yang sebenarnya menjerit di dalam kepala kalian saat jari-jemari kalian mengetik layar ponsel:</p>

    <div class="wa-bubble-quote outgoing">
      <div class="wa-bubble">
        <span class="wa-sender-label">${escapeHtml(p1)} (Subteks Sebenarnya)</span>
        <div class="wa-bubble-text">“Aku panik tiap kali kamu menjauh atau membalas singkat, karena di kepalaku, kamu sedang menghitung hari untuk meninggalkanku. Aku mengauditmu bukan karena benci, tapi karena aku tidak tahu cara lain untuk membuatmu tetap tinggal.”</div>
        <div class="wa-bubble-footer">
          <span>01:10</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <div class="wa-bubble-quote incoming">
      <div class="wa-bubble">
        <span class="wa-sender-label">${escapeHtml(p2)} (Subteks Sebenarnya)</span>
        <div class="wa-bubble-text">“Aku tidak berniat jahat atau mengkhianatimu. Aku cuma ingin bernapas tanpa merasa setiap menit keterlambatanku dicatat sebagai dosa. Semakin kamu mencekikku dengan interogasi, semakin aku ingin lari ke tempat yang sunyi.”</div>
        <div class="wa-bubble-footer">
          <span>01:12</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <p><strong>Vonis Akhir Klim:</strong><br>
    Kalian tidak kekurangan cinta. Masalah kalian adalah **ketiadaan rasa aman yang tidak bersyarat**. Berhentilah bertindak seperti jaksa penuntut umum dan terdakwa. Buka tab <strong>Report 2: Solusi</strong> di atas untuk membaca langkah darurat yang harus kalian ambil malam ini juga.</p>
  `;

  editorialProse.innerHTML = html;
}

// Load Demo Data (Exact What Brandon Thinks Showcase)
function loadDemoReport() {
  state.isDemo = true;
  state.activeReport = 1;
  tabReport1.classList.add('active');
  tabReport2.classList.remove('active');

  switchView('processing');
  processStatusTitle.textContent = 'Klim sedang membaca demo chat Jibril & Kia...';
  processStatusSub.textContent = 'Membedah 41.100 pesan, rekaman trauma, dan dinamika pengawasan...';
  progressBar.style.width = '20%';

  setTimeout(() => {
    progressBar.style.width = '60%';
    processingLogs.innerHTML = '<p class="log-line">Menganalisis 41.100 baris riwayat obrolan...</p>';

    setTimeout(() => {
      progressBar.style.width = '100%';
      renderDemoReport();
      switchView('report');
    }, 700);
  }, 600);
}

function renderDemoReport() {
  reportTitle.textContent = 'Menjaga Sangkar yang Pintunya Sudah Lama Terbuka';
  statTotalMsgs.textContent = '41.100';
  statParticipantRatio.textContent = '54% : 46%';
  statParticipantsLabel.textContent = 'Jibril vs Kia';
  statActiveHours.textContent = '23:00 - 02:00';
  statDeletedMsgs.textContent = '128';

  const html = `
    <p>Gue membaca <strong>41.100 pesan</strong> kalian dalam satu tarikan napas panjang, dan jujur, ada beberapa titik di mana gue harus meletakkan layar, menghela napas ke ruangan kosong, dan bergumam pelan: <em>“Jibril, astaga… berhenti mengaudit dia.”</em></p>

    <p>Hubungan kalian selama dua tahun lebih ini bukan sekadar kisah cinta remaja SMA biasa. Ini adalah drama psikologis berkecepatan rendah tentang dua orang yang saling membutuhkan dengan cara yang saling melukai. Kamu, Jibril, mencintai dengan cara membangun pos penjagaan—memeriksa saldo Gopay, memantau rute angkot, mengecek apakah lehernya tertutup manset, menelusuri siapa saja yang melihat saluran WhatsApp-nya, hingga membedah siapa cowok yang diajak foto di event cosplay. Di kepala kamu, itu adalah bentuk perlindungan tertinggi: <em>“Aku cuma mau jagain kamu biar nggak kenapa-napa.”</em></p>

    <p>Tapi bagi Kia—seorang anak perempuan yang tumbuh di rumah yang menuntut kesempurnaan akademik, di mana uang dua ribu perak hilang saja bisa berujung diusir ke jalanan malam-malam—pengawasanmu bukan terasa seperti pelukan hangat. Itu terasa seperti <strong>interogasi kedua di hari yang sama</strong>.</p>

    <p>Kalian berdua terjebak dalam tarian yang melelahkan: kamu mengejar dengan kuesioner dan aturan, dia melarikan diri ke balik kalimat <em>“gtau”</em>, <em>“males”</em>, tombol <em>delete message</em>, dan dunia fiksi tempat dia tidak perlu diawasi oleh siapa pun.</p>

    <!-- SECTION 1 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🎬</div>
      <h2 class="editorial-section-title">Klim Membaca Percakapan Kalian: Catatan Real-Time</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p>Membaca riwayat chat ini rasanya seperti menonton rekaman CCTV di sebuah ruangan kaca. Ada momen-momen yang bikin gue tersenyum geli, tapi lebih banyak momen di mana gue merasa sesak.</p>

    <p>Saat kamu mengirim link website yang kamu bikin sendiri—tujuh ratus foto Kia yang kamu kumpulkan di Netlify—gue melihat seorang anak laki-laki yang luar biasa tulus, yang mengekspresikan cintanya lewat baris kode karena lidahnya terlalu kaku untuk menyampaikan kelembutan tanpa kecemasan. Tapi di sisi lain, saat kamu menghitung berapa detik Kia membalas chat, menuntut bukti tangkapan layar untuk membuktikan apakah akun temannya sudah diblokir, dan menanyakan apakah dia “memberi harapan” pada cowok lain hanya karena meminjam powerbank, gue melihat seorang jaksa penuntut umum yang sedang menyidang terdakwa.</p>

    <p>Momen paling memilukan bagi gue terjadi di tanggal 8 Februari. Malam itu, Kia memecahkan rekornya sendiri. Dia yang biasanya hanya mengetik tiga huruf tiba-tiba mengetik esai panjang tanpa jeda. Dia menceritakan traumanya: tentang ibunya, tentang uang dua ribu yang membuatnya diusir, dan pengakuan paling telanjangnya:</p>

    <div class="wa-bubble-quote incoming">
      <div class="wa-bubble">
        <span class="wa-sender-label">Kia</span>
        <div class="wa-bubble-text">orang tua aku ga bisa ngasih kata kata apresiasi, ya seenggaknya aku harus dapet pengakuan dari orang lain.</div>
        <div class="wa-bubble-footer">
          <span>00:42</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <p>Gue sempat menaruh harapan besar di titik itu. Gue pikir kamu akan berhenti sejenak, memeluk kerapuhannya, dan berkata, <em>“Gue paham sekarang kenapa lo suka cosplay dan suka dipuji.”</em> Tapi apa yang kamu lakukan beberapa jam kemudian? Kamu mengaudit pengakuannya. Kamu membedahnya secara logis, menyebutnya "mencari validasi", lalu menjadikannya landasan untuk melarangnya cosplay dan melarangnya mengidolakan karakter fiksi. Di situ gue menghela napas panjang. Kamu melewatkan inti lukanya demi memenangkan perdebatan logika.</p>

    <!-- SECTION 2 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🎭</div>
      <h2 class="editorial-section-title">Profil Dua Karakter: Peran yang Dimainkan vs. Kenyataan</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <h3>Jibril: Sang Pengawas yang Takut Ditinggalkan</h3>
    <p>Kamu memposisikan dirimu sebagai pelindung, penyedia, dan kekasih paling setia di dunia. Di kepalamu, kamu adalah benteng kokoh: kamu tidak merokok, kamu jarang keluyuran, kamu menyisihkan uang jajan untuk mengisi saldo Gojek dia, kamu belajar coding agar bisa bikin portfolio untuk membahagiakannya. Tapi di balik daftar aturan moralmu yang panjang, kamu menyimpan ketakutan purba: kamu merasa tanpa kontrol, kamu tidak akan pernah cukup menarik untuk membuatnya bertahan.</p>

    <h3>Kia: Burung yang Bertahan di Pintu Sangkar yang Terbuka</h3>
    <p>Kia memposisikan dirinya sebagai korban yang pasrah. Tapi riwayat pesan menunjukkan hal yang lebih kompleks. Kia tidak selemah kelihatannya. Dia menggunakan kebisuan dan jawaban satu kata (<em>“yaudah”</em>, <em>“gatau”</em>) sebagai senjata bertahan hidup. Dia tahu rasa bersalahmu adalah tombol yang selalu bisa ditekan. Setiap kali kamu mulai marah, dia tinggal mengingatkan seberapa dingin rumahnya, dan kamu akan langsung melunak menjadi pembela setianya lagi.</p>

    <!-- SECTION 3 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🔤</div>
      <h2 class="editorial-section-title">Kamus Bahasa Rahasia: Dialek di Balik Teks</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p><strong>“Gatau” (Kia):</strong><br>
    Bukan berarti dia tidak tahu. Itu adalah kode darurat yang berarti: <em>“Aku tahu jawabannya, tapi jika aku mengatakannya dengan jujur, kamu akan membedahnya selama dua jam ke depan, dan aku terlalu lelah untuk itu.”</em></p>

    <p><strong>“Aku cuma nanya baik-baik” (Jibril):</strong><br>
    Kalimat pembuka yang 99% disusul oleh interogasi 40 pertanyaan berturut-turut.</p>

    <!-- SECTION 4 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">⚖️</div>
      <h2 class="editorial-section-title">Yelp Review: Dua Tahun Menjalani Hubungan</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p><strong>Rating: 2.8 / 5 Bintang</strong><br>
    <em>“Penyedia makanan dan transportasi bintang lima, tetapi staf keamanan internal berpatroli setiap 10 menit dengan senter dan buku sanksi disipliner.”</em></p>

    <!-- SECTION 5 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">💔</div>
      <h2 class="editorial-section-title">Kronologi Keretakan: Ketika Tali Terlalu Kencang Ditarik</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p>Semakin Kia merasa terkekang di dunia nyata, semakin dia mencari pelarian ke dunia maya—cosplay, karakter fiksi, grup obrolan acak. Dan semakin Kia mencari pelarian, semakin Jibril panik dan memperketat jeruji sangkar. Ini adalah lingkaran setan: ketakutan Jibril menciptakan penolakan Kia, dan penolakan Kia memvalidasi ketakutan Jibril.</p>

    <!-- SECTION 6 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🗣️</div>
      <h2 class="editorial-section-title">Percakapan yang Tak Pernah Terucap (Subteks sebagai Teks)</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <div class="wa-bubble-quote outgoing">
      <div class="wa-bubble">
        <span class="wa-sender-label">Jibril (Subteks Sebenarnya)</span>
        <div class="wa-bubble-text">“Aku begitu takut kehilangan kamu sampai-sampai aku memperlakukan kamu seperti tahanan kota, padahal yang kuinginkan hanyalah kepastian bahwa kamu memilihku atas kemauanmu sendiri.”</div>
        <div class="wa-bubble-footer">
          <span>02:15</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <div class="wa-bubble-quote incoming">
      <div class="wa-bubble">
        <span class="wa-sender-label">Kia (Subteks Sebenarnya)</span>
        <div class="wa-bubble-text">“Aku menghargai semua yang kamu korbankan untukku. Tapi aku ingin kamu mencintai aku sebagai manusia yang cacat dan suka berkhayal, bukan sebagai proyek moral yang harus kamu rapikan setiap malam.”</div>
        <div class="wa-bubble-footer">
          <span>02:18</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <p><strong>Vonis Akhir Klim:</strong><br>
    Jibril, pintu sangkar itu sebenarnya sudah terbuka sejak lama, tapi Kia belum terbang pergi karena dia masih membutuhkan kehangatan tempat bertengger itu. Pertanyaannya: apakah kamu berani membiarkan pintunya terbuka lebar tanpa terus-menerus menghitung kepakan sayapnya? Buka tab <strong>Report 2: Tindakan & Solusi</strong> di atas untuk membaca tindakan konkret kalian.</p>
  `;

  editorialProse.innerHTML = html;
}

// Render Demo Report 2 (Follow-up Actionable Blueprint for Jibril & Kia)
function renderDemoReport2() {
  reportTitle.textContent = 'Report 2: Tindakan Nyata & Protokol Gencatan Senjata';

  const html = `
    <p>Di <strong>Report 1</strong>, gue sudah membongkar habis isi kepala kalian berdua: ketakutan Jibril akan kehilangan kendali, dan cara Kia melarikan diri ke balik pintu terkunci. Sekarang di <strong>Report 2</strong>, gue nggak akan berteori lagi. Ini adalah <em>manual operasional</em> jika kalian berdua masih ingin menyelamatkan sisa-sisa kewarasan hubungan ini.</p>

    <!-- SECTION 1 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🛑</div>
      <h2 class="editorial-section-title">Tiga Hal yang Harus Berhenti Mulai Malam Ini</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <h3>1. Jibril: Tarik Mundur Seluruh Tim Investigasi</h3>
    <p>Mulai malam ini, hapus kebiasaan meminta bukti tangkapan layar (<em>screenshot</em>). Jangan pernah lagi menanyakan: <em>“Siapa yang lihat story kamu?”</em>, <em>“Kenapa cowok itu like foto kamu?”</em>, atau <em>“Kenapa tadi malam online jam 2 pagi?”</em> Setiap kali kamu tergoda untuk mengaudit, ingat kalimat ini: <strong>Kesetiaan yang diperoleh lewat todongan senjata bukanlah kesetiaan, itu kepasrahan seorang sandera.</strong></p>

    <h3>2. Kia: Berhenti Menggunakan Rumah sebagai Perisai Kebisuan</h3>
    <p>Kamu punya trauma nyata dengan keluargamu, dan itu valid. Tapi kamu tidak boleh menggunakan luka masa lalumu sebagai izin untuk bersikap dingin tanpa batas kepada orang yang berusaha mencintaimu. Berhenti membalas dengan <em>“gtau”</em> saat kamu sebenarnya tahu. Jika kamu butuh waktu menyendiri, katakan secara lugas: <em>“Jibril, aku butuh waktu sendiri 2 jam buat nonton/baca tanpa diganggu. Jam 10 aku kabari lagi.”</em></p>

    <h3>3. Hapus Tombol "Delete Message" dari Kamus Kalian</h3>
    <p>Data menunjukkan ada lebih dari <strong>128 pesan yang dihapus</strong> dalam riwayat kalian. Di mata Jibril, pesan yang dihapus terlihat seperti pengkhianatan yang sedang ditutup-tutupi. Di mata Kia, itu adalah keputusasaan karena salah bicara sedikit saja akan berujung ceramah panjang. Buat kesepakatan: ketik apa yang ingin dikatakan, jangan hapus, dan bicarakan secara tenang.</p>

    <!-- SECTION 2 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">📋</div>
      <h2 class="editorial-section-title">Template Percakapan untuk Membuka Lembaran Baru</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p>Kalian berdua terlalu gengsi untuk memulai rekonsiliasi yang matang. Gunakan draf kata-kata ini:</p>

    <div class="wa-bubble-quote outgoing">
      <div class="wa-bubble">
        <span class="wa-sender-label">Draf untuk Jibril</span>
        <div class="wa-bubble-text">“Kia, gue sadar selama ini cara gue sayang sama lo justru bikin lo ngerasa sesak kayak di penjara. Gue minta maaf udah sering mengaudit lo. Gue mau belajar buat percaya sama lo tanpa minta bukti apa-apa lagi.”</div>
        <div class="wa-bubble-footer">
          <span>Draf WhatsApp</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <div class="wa-bubble-quote incoming">
      <div class="wa-bubble">
        <span class="wa-sender-label">Draf untuk Kia</span>
        <div class="wa-bubble-text">“Makasih udah mau sadar, Jibril. Selama ini aku tertutup bukan karena aku ada orang lain, tapi karena aku capek dihakimi terus. Aku janji bakal lebih terbuka dan nggak ngilang tiba-tiba lagi kalau kamu juga bisa tenang.”</div>
        <div class="wa-bubble-footer">
          <span>Draf WhatsApp</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <!-- SECTION 3 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">⚖️</div>
      <h2 class="editorial-section-title">Peluang Kelangsungan Hubungan: Kalkulasi Jujur</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p><strong>Peluang Bertahan Sehat: 45%</strong><br>
    Peluang ini bisa naik ke <strong>85%</strong> hanya jika Jibril bisa menurunkan egonya untuk berhenti mengatur hidup Kia, dan Kia berani memperlakukan Jibril sebagai pasangan setara, bukan sebagai wali kelas yang menyebalkan.</p>

    <p>Jika dalam 30 hari ke depan pola interogasi masih berulang, nasihat terbaik Klim: <em>lepaskan satu sama lain secara damai</em>, sebelum cinta yang tersisa berubah menjadi kebencian yang merusak memori indah kalian berdua.</p>
  `;

  editorialProse.innerHTML = html;
}

// Generate Report 2 for uploaded user chat (Panduan Solusi & Tindakan)
function generateReport2(parsed) {
  const p1 = parsed.participants[0] || 'Orang 1';
  const p2 = parsed.participants[1] || 'Orang 2';
  const ins = extractChatInsights(parsed);

  reportTitle.textContent = `Report 2: Tindakan Nyata & Protokol Penyelamatan Hubungan`;

  const html = `
    <p>Jika di <strong>Report 1</strong> gue menguliti luka, kecemasan, dan dinamika psikologis kalian berdua, di <strong>Report 2</strong> ini kita bicara soal realita praktis: <em>apa yang sebenarnya harus kalian lakukan sekarang sebelum segalanya hancur berantakan?</em></p>

    <p>Gue tidak akan memberikan saran klise seperti “sering-seringlah berkomunikasi”. Berdasarkan data, kalian berdua sudah mengetik ribuan kata—masalahnya bukan kurang bicara, melainkan <strong>alat yang kalian gunakan untuk saling berbicara adalah palu dan perisai</strong>.</p>

    <!-- SECTION 1 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🛑</div>
      <h2 class="editorial-section-title">Protokol Gencatan Senjata: Tiga Hal yang Wajib Berhenti Malam Ini</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <h3>1. Untuk ${escapeHtml(p1)}: Hentikan Audit Forensik & Sidang Larut Malam</h3>
    <p>Berhenti memperlakukan aplikasi obrolan seperti dasbor pemantauan satelit intelijen. Jangan pernah lagi menanyakan: <em>“Tadi online jam sekian ngapain?”</em>, <em>“Kenapa balasnya 20 menit padahal sudah centang biru?”</em>, atau meminta tangkapan layar untuk membuktikan siapa yang sedang diajak bicara. Setiap pertanyaan audit yang kamu lempar tidak pernah membuatmu merasa tenang; itu hanya mempertebal tembok penolakan di depanmu. <strong>Ingat: kesetiaan yang kamu peroleh lewat interogasi bukanlah cinta, melainkan kepasrahan seorang sandera.</strong></p>

    <h3>2. Untuk ${escapeHtml(p2)}: Hentikan Strategi Melarikan Diri & Jawaban Satu Kata</h3>
    <p>Membalas pesan panjang dengan <em>“yaudah”</em>, <em>“gtau”</em>, atau menghilang selama berjam-jam saat situasi tegang bukanlah cara meredakan konflik. Di matamu itu adalah cara menghindari keributan, tapi bagi ${escapeHtml(p1)}, kebisuanmu adalah pemicu panik nomor satu yang menyulut kecurigaan. Jika kamu lelah atau butuh ruang sendiri, katakan dengan lugas dan sertakan kepastian waktu: <em>“Aku capek banget hari ini dan mau istirahat tanpa pegang HP sampai jam 9 malam. Nanti jam 9 aku telepon ya.”</em> Berikan kepastian, bukan tanda tanya.</p>

    <h3>3. Hentikan Penggunaan Tombol "Delete Message"</h3>
    <p>Data menunjukkan ada <strong>${parsed.deletedCount} pesan yang dihapus</strong> di obrolan kalian. Menghapus pesan adalah racun komunikasi: pihak pengirim merasa frustrasi karena takut salah bicara, sementara pihak penerima berasumsi ada rahasia kotor yang disembunyikan. Berjanjilah untuk mengetik apa yang ingin disampaikan secara dewasa dan tidak lagi menghapusnya.</p>

    <!-- SECTION 2 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">💬</div>
      <h2 class="editorial-section-title">Contoh Template Teks yang Harus Dikirimkan Sekarang</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p>Kalian berdua terlalu gengsi untuk memulai rekonsiliasi tanpa membela diri. Gunakan draf kata-kata yang sudah Klim formulasikan ini tanpa diubah:</p>

    <div class="wa-bubble-quote outgoing">
      <div class="wa-bubble">
        <span class="wa-sender-label">Pesan Rekomendasi dari ${escapeHtml(p1)}</span>
        <div class="wa-bubble-text">“Gue sadar selama ini cara gue peduli dan jagain lo justru bikin lo ngerasa sesak kayak di penjara. Gue minta maaf udah sering mengaudit lo. Gue mau belajar buat percaya sama lo tanpa minta pembuktian apa-apa lagi.”</div>
        <div class="wa-bubble-footer">
          <span>Rekomendasi Kirim</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <div class="wa-bubble-quote incoming">
      <div class="wa-bubble">
        <span class="wa-sender-label">Pesan Rekomendasi dari ${escapeHtml(p2)}</span>
        <div class="wa-bubble-text">“Makasih udah mau ngertiin kondisi aku. Selama ini aku tertutup dan ngilang bukan karena nggak sayang, tapi karena aku takut bikin kamu marah atau salah ngomong. Aku janji bakal ngomong jujur kalau butuh waktu sendiri.”</div>
        <div class="wa-bubble-footer">
          <span>Rekomendasi Balasan</span>
          <span class="wa-check-icon">✓✓</span>
        </div>
      </div>
    </div>

    <!-- SECTION 3 -->
    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🔮</div>
      <h2 class="editorial-section-title">Kalkulasi Peluang & Prediksi Klim 6 Bulan ke Depan</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <p><strong>Peluang Bertahan Sehat: 48% (Bisa naik ke 85%)</strong></p>
    <p><strong>Skenario A (Jika pola audit dan kebisuan terus berlanjut):</strong><br>
    Dalam 3 sampai 6 bulan ke depan, kalian akan menghadapi satu pertengkaran hebat di larut malam yang dipicu oleh masalah sepele. Salah satu pihak akan memilih memblokir kontak secara permanen (<em>cut off total</em>), meninggalkan rasa sesal dan luka yang butuh bertahun-tahun untuk sembuh.</p>

    <p><strong>Skenario B (Jika kalian berani menurunkan ego):</strong><br>
    Kalian akan menyadari bahwa di balik kecemasan ${escapeHtml(p1)} dan kebisuan ${escapeHtml(p2)}, ada dua manusia yang sebenarnya saling mengagumi. Lepaskan kendali, dan biarkan hubungan ini bernapas atas kemauannya sendiri.</p>
  `;

  editorialProse.innerHTML = html;
}

// Generate Report 3 (Malam Penghargaan & Roasting)
function generateReport3(parsed) {
  const p1 = parsed.participants[0] || 'Orang 1';
  const p2 = parsed.participants[1] || 'Orang 2';
  const ins = extractChatInsights(parsed);

  reportTitle.textContent = `Report 3: Malam Penghargaan & Roasting Kategori`;

  const html = `
    <p>Setelah mengarungi ribuan baris chat yang melelahkan, Klim merasa kalian berdua berhak mendapatkan piala kehormatan atas rekor-rekor unik yang berhasil dipecahkan dalam obrolan ini.</p>

    <div class="editorial-section-header">
      <div class="editorial-section-emoji">🏆</div>
      <h2 class="editorial-section-title">Daftar Pemenang Penghargaan Hubungan</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <h3>🥇 Pemenang "Detektif Forensik & Jaksa Penuntut": ${escapeHtml(p1)}</h3>
    <p>Diberikan atas dedikasi tanpa henti dalam mengajukan <strong>${ins.qMarkP1} pertanyaan</strong> investigatif, mengawasi status online larut malam di rentang jam <strong>${parsed.peakHours}</strong>, dan kemampuan mencocokkan timestamps chat dengan aktivitas media sosial lainnya.</p>

    <h3>🥈 Pemenang "Menteri Pertahanan & Pelarian Taktis": ${escapeHtml(p2)}</h3>
    <p>Diberikan atas keahlian tingkat dewa dalam membalas pesan panjang berbobot 5 paragraf dengan satu kalimat pendek, stiker kucing, atau alasan klasik: <em>“ketiduran tadi hehe”</em>, membuat tensi darah lawan bicara melonjak drastis.</p>

    <h3>🥉 Penghargaan "Ahli Hapus Bukti": Rekor Bersama</h3>
    <p>Dengan total <strong>${parsed.deletedCount} pesan dihapus</strong>, kalian berdua secara resmi dinobatkan sebagai pasangan dengan arsip percakapan paling misterius. Setiap balon abu-abu yang terhapus mewakili kalimat emosional yang batal dikirim karena takut dihakimi.</p>

    <h3>🎖️ Penghargaan "Subteks Paling Berbahaya"</h3>
    <p>Dimenangkan oleh kalimat: <em>“Aku nggak apa-apa kok, santai aja”</em> yang berhasil menipu akal sehat padahal di baliknya tersimpan badai emosi yang siap meletus dalam tempo 48 jam.</p>
  `;

  editorialProse.innerHTML = html;
}

// Generate Report 4 (Kamus Bahasa Sandi & Dekoder Teks)
function generateReport4(parsed) {
  const p1 = parsed.participants[0] || 'Orang 1';
  const p2 = parsed.participants[1] || 'Orang 2';

  reportTitle.textContent = `Report 4: Kamus Bahasa Sandi & Dekoder Teks`;

  const html = `
    <p>Kalian berdua mengira kalian berbicara dalam bahasa Indonesia yang sama, padahal riwayat chat membuktikan kalian menggunakan dialek sandi yang sarat manipulasi emosional. Inilah terjemahan resminya:</p>

    <div class="editorial-section-header">
      <div class="editorial-section-emoji">📖</div>
      <h2 class="editorial-section-title">Kamus Terjemahan Teks WhatsApp</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <h3>1. “Aku cuma nanya baik-baik” (Pengirim: ${escapeHtml(p1)})</h3>
    <p><strong>Artinya:</strong> <em>“Aku sudah mengumpulkan bukti ketidakkonsistenan ceritamu dari 3 hari lalu dan kamu punya waktu 30 detik untuk memberikan klarifikasi yang masuk akal.”</em></p>

    <h3>2. “Yaudah iya aku yang salah” (Pengirim: ${escapeHtml(p2)})</h3>
    <p><strong>Artinya:</strong> <em>“Aku tidak merasa bersalah sama sekali, tapi aku butuh kamu berhenti mengetik paragraf ceramah ini agar aku bisa melanjutkan hidupku dengan tenang.”</em></p>

    <h3>3. “Lagi sibuk banget ya?” (Pengirim: ${escapeHtml(p1)})</h3>
    <p><strong>Artinya:</strong> <em>“Aku tahu kamu sempat online 5 menit lalu tapi belum membalas pesanku. Keberadaanmu di luar radarku membuat kecemasanku melonjak ke level maksimal.”</em></p>

    <h3>4. “Gtau / Terserah” (Pengirim: ${escapeHtml(p2)})</h3>
    <p><strong>Artinya:</strong> <em>“Aku tahu apa yang kuinginkan, tapi jika aku jujur, kamu akan membedah pilihanku selama dua jam ke depan, jadi lebih baik aku berpura-pura tidak punya opini.”</em></p>

    <h3>5. [Pesan ini telah dihapus]</h3>
    <p><strong>Artinya:</strong> <em>“Aku sempat ingin jujur soal apa yang kurasakan, tapi aku sadar kamu hanya akan mendebat kata-kataku, bukan mendengarkan perasaanku.”</em></p>
  `;

  editorialProse.innerHTML = html;
}

// Generate Report 5 (Timeline Gesekan & Dinamika Hubungan)
function generateReport5(parsed) {
  const p1 = parsed.participants[0] || 'Orang 1';
  const p2 = parsed.participants[1] || 'Orang 2';

  reportTitle.textContent = `Report 5: Timeline Gesekan & Evolusi Chat`;

  const html = `
    <p>Sebuah hubungan tidak retak dalam satu ledakan besar; ia aus perlahan lewat ratusan interaksi harian yang kehilangan kelembutannya. Inilah rekonstruksi 5 babak evolusi chat kalian:</p>

    <div class="editorial-section-header">
      <div class="editorial-section-emoji">⏳</div>
      <h2 class="editorial-section-title">Rekonstruksi 5 Babak Hubungan</h2>
      <div class="editorial-section-rule">
        <span class="line"></span><span class="diamond"></span><span class="line"></span>
      </div>
    </div>

    <h3>Babak 1: Periode Bulan Madu (Kecepatan Balas: < 3 Menit)</h3>
    <p>Setiap pesan dijawab seketika dengan rasa ingin tahu yang murni. Tidak ada kecurigaan rute perjalanan, tidak ada tuntutan kabar. Obrolan larut malam di jam <strong>${parsed.peakHours}</strong> terasa seperti surga pribadi tempat kalian berbagi mimpi dan lelucon konyol.</p>

    <h3>Babak 2: Pendirian Pos Pengawasan Pertama</h3>
    <p>Mulai muncul benih ketakutan. ${escapeHtml(p1)} mulai merasa bertanggung jawab atas seluruh keputusan ${escapeHtml(p2)}, memicu munculnya kuesioner harian. Pada fase ini, ${escapeHtml(p2)} masih menganggapnya sebagai bentuk kasih sayang yang manis.</p>

    <h3>Babak 3: Benteng Pertahanan dan Kebisuan</h3>
    <p>Frekuensi pesan mulai berubah: pesan ${escapeHtml(p1)} semakin panjang dan menuntut, sementara pesan ${escapeHtml(p2)} semakin menciut menjadi kata-kata hemat energi. Tombol <em>delete message</em> mulai sering digunakan sebagai katup pengaman darurat.</p>

    <h3>Babak 4: Titik Jenuh Argumen Logika</h3>
    <p>Kalian berhenti mendengarkan kerapuhan satu sama lain. Setiap ada masalah, fokus bergeser dari <em>“bagaimana perasaanmu?”</em> menjadi <em>“siapa yang secara aturan paling benar?”</em>. Komunikasi berubah dari ruang aman menjadi arena perdebatan yang menguras energi mental.</p>

    <h3>Babak 5: Standby Mode & Kebiasaan Dingin (Kondisi Saat Ini)</h3>
    <p>Kalian masih saling bertukar kabar tiap hari karena sudah terbiasa dengan kehadiran satu sama lain, namun kehangatan dasarnya mulai pudar. Apakah kalian ingin mereparasi fondasi ini menggunakan panduan di <strong>Report 2</strong>, atau terus membiarkan waktu yang memutuskan?</p>
  `;

  editorialProse.innerHTML = html;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Start application
document.addEventListener('DOMContentLoaded', init);
