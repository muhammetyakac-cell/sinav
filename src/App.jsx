import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  FileText, 
  Download, 
  Upload, 
  Clock,
  ThumbsUp,
  X,
  Trash2,
  BookOpen,
  Lock,
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';

// Supabase Yapılandırması
const runtimeSupabaseUrl = typeof globalThis !== 'undefined'
  ? (globalThis.__supabase_url || globalThis.SUPABASE_URL)
  : '';
const runtimeSupabaseAnonKey = typeof globalThis !== 'undefined'
  ? (globalThis.__supabase_anon_key || globalThis.SUPABASE_ANON_KEY)
  : '';
const storedSupabaseUrl = typeof globalThis !== 'undefined' && globalThis.localStorage
  ? globalThis.localStorage.getItem('SUPABASE_URL')
  : '';
const storedSupabaseAnonKey = typeof globalThis !== 'undefined' && globalThis.localStorage
  ? globalThis.localStorage.getItem('SUPABASE_ANON_KEY')
  : '';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || runtimeSupabaseUrl
  || 'https://phicbgmciqrfeuwbnlrv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || runtimeSupabaseAnonKey
  || storedSupabaseAnonKey
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaWNiZ21jaXFyZmV1d2JubHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjQxMDAsImV4cCI6MjA5MDA0MDEwMH0.6Wx-yAccwOpklSjWBz6dzS3M2awLcxId4eXBA5H2NFI';
const resolvedSupabaseUrl = supabaseUrl || storedSupabaseUrl || '';
const hasSupabaseConfig = Boolean(resolvedSupabaseUrl && supabaseAnonKey);
const supabaseBucket = 'notes';
const bannerImageUrl = 'https://gcdnb.pbrd.co/images/0cybfUNV5ItI.jpg';
const archeoTitles = ["Lidya Parası", "Truva Atı", "Kayıp Sütun", "Antik Çizim", "Toprak Kap", "Obsidyen Bıçak", "Sagalassos Yolcusu", "Knidos Aslanı"];
const trToEn = (str) => {
  const mapping = {
    'Ğ': 'G', 'ğ': 'g', 'Ü': 'U', 'ü': 'u', 'Ş': 'S', 'ş': 's',
    'İ': 'I', 'ı': 'i', 'Ö': 'O', 'ö': 'o', 'Ç': 'C', 'ç': 'c'
  };
  return str.replace(/[ĞğÜüŞşİıÖöÇç]/g, (letter) => mapping[letter]);
};

function RunnerGameModal({ onClose }) {
  const canvasRef = useRef(null);
  const [ui, setUi] = useState({ distance: 0, coins: 0, gameOver: false, highScore: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const laneX = [-3.5, 0, 3.5];
    const worldToScreenX = (x) => (canvas.width / 2) + (x * 45);
    const player = {
      lane: 1,
      x: 0,
      y: 0,
      vy: 0,
      targetX: 0,
      isRolling: false,
      rollUntil: 0,
      jumpIntentUntil: 0,
    };

    const gravity = -70 * 3;
    const baseJumpVelocity = 22;
    const playerZ = 6;
    let speed = 12;
    const maxSpeed = 30;
    let distance = 0;
    let coins = 0;
    let gameOver = false;
    let lastSpeedBoost = 0;
    let lastTime = performance.now();
    const coyoteMs = 100;
    const roadSegments = Array.from({ length: 12 }, (_, i) => ({ z: i * 30 }));
    const obstaclePool = Array.from({ length: 15 }, (_, i) => ({
      z: 20 + (i * 12),
      lane: i % 3,
      type: i % 5 === 0 ? 'coin' : (i % 2 === 0 ? 'jump' : 'duck')
    }));

    const readHighScore = () => Number(localStorage.getItem('runner_high_score') || 0);
    setUi((prev) => ({ ...prev, highScore: readHighScore() }));

    const moveLane = (dir) => {
      player.lane = Math.max(0, Math.min(2, player.lane + dir));
      player.targetX = laneX[player.lane];
    };
    const jump = () => {
      if (player.y <= 0.01) {
        const speedFactor = Math.max(0.8, 12 / speed);
        player.vy = baseJumpVelocity * speedFactor;
      }
    };
    const roll = () => {
      player.isRolling = true;
      player.rollUntil = performance.now() + 800;
    };

    let touchStart = null;
    const onTouchStart = (e) => { touchStart = e.touches[0]; };
    const onTouchEnd = (e) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.clientX;
      const dy = t.clientY - touchStart.clientY;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) moveLane(1);
        if (dx < -30) moveLane(-1);
      } else {
        if (dy < -30) { player.jumpIntentUntil = performance.now() + coyoteMs; jump(); }
        if (dy > 30) roll();
      }
      touchStart = null;
    };

    const onKey = (e) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') moveLane(-1);
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') moveLane(1);
      if (e.key === 'ArrowUp' || e.key === ' ') { player.jumpIntentUntil = performance.now() + coyoteMs; jump(); }
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') roll();
    };

    const resetObstacle = (obs, farthestZ) => {
      obs.z = farthestZ + 12 + Math.random() * 10;
      obs.lane = Math.floor(Math.random() * 3);
      const r = Math.random();
      obs.type = r < 0.2 ? 'coin' : r < 0.6 ? 'jump' : 'duck';
    };

    const checkCollision = (obs, now) => {
      const laneMatch = obs.lane === player.lane;
      const near = Math.abs(obs.z - playerZ) < 0.8;
      if (!laneMatch || !near) return false;
      if (obs.type === 'coin') {
        coins += 1;
        obs.z = -999;
        return false;
      }

      if (obs.type === 'jump') {
        if (player.y > 1.3) return false;
        if (player.jumpIntentUntil > now) { jump(); return false; }
        return true;
      }
      if (obs.type === 'duck') {
        return !player.isRolling;
      }
      return true;
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // road lanes
      for (let i = 0; i < 3; i++) {
        const x = worldToScreenX(laneX[i]);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // obstacles
      obstaclePool.forEach((obs) => {
        const zToY = canvas.height - (obs.z * 18);
        if (zToY < -40 || zToY > canvas.height + 40) return;
        const x = worldToScreenX(laneX[obs.lane]);
        if (obs.type === 'coin') {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(x, zToY, 8, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        ctx.fillStyle = obs.type === 'jump' ? '#ef4444' : '#22c55e';
        const h = obs.type === 'jump' ? 28 : 50;
        ctx.fillRect(x - 14, zToY - h, 28, h);
      });

      // player
      const px = worldToScreenX(player.x);
      const py = canvas.height - 120 - (player.y * 30);
      const ph = player.isRolling ? 20 : 40;
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(px - 12, py - ph, 24, ph);
    };

    let rafId = 0;
    const loop = (now) => {
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;
      if (!gameOver) {
        if (now - lastSpeedBoost >= 10000) {
          speed = Math.min(maxSpeed, speed * 1.02);
          lastSpeedBoost = now;
        }
        distance += speed * dt;

        // lane smoothing
        player.x += (player.targetX - player.x) * Math.min(1, dt * 15);
        // jump physics
        player.vy += gravity * dt;
        player.y = Math.max(0, player.y + player.vy * dt);
        if (player.y === 0 && player.vy < 0) player.vy = 0;
        if (player.isRolling && now > player.rollUntil) player.isRolling = false;

        const farthest = Math.max(...obstaclePool.map((o) => o.z));
        obstaclePool.forEach((obs) => {
          obs.z -= speed * dt;
          if (obs.z < -2) resetObstacle(obs, farthest);
          if (checkCollision(obs, now)) gameOver = true;
        });

        // recycle road segments
        const maxSeg = Math.max(...roadSegments.map((s) => s.z));
        roadSegments.forEach((seg) => {
          seg.z -= speed * dt;
          if (seg.z < -30) seg.z = maxSeg + 30;
        });

        if (gameOver) {
          const highScore = readHighScore();
          if (distance > highScore) localStorage.setItem('runner_high_score', String(Math.floor(distance)));
        }
      }

      render();
      setUi({
        distance: Math.floor(distance),
        coins,
        gameOver,
        highScore: readHighScore(),
      });
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener('keydown', onKey);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 bg-slate-800 text-white flex items-center justify-between">
          <h3 className="font-semibold">🏃 Kazı Koşusu</h3>
          <button onClick={onClose} className="text-xs bg-white/20 px-2 py-1 rounded-lg">Kapat</button>
        </div>
        <div className="px-4 py-2 text-white text-xs flex justify-between bg-slate-800/70">
          <span>Mesafe: {ui.distance}m</span>
          <span>Altın: {ui.coins}</span>
          <span>En Yüksek: {ui.highScore}m</span>
        </div>
        <canvas ref={canvasRef} width={360} height={520} className="w-full h-[65vh] max-h-[520px] block bg-slate-900" />
        {ui.gameOver && (
          <div className="px-4 py-3 text-center text-rose-300 bg-slate-900 border-t border-slate-700 text-sm">
            Oyun bitti! Yeni tur için modalı kapatıp tekrar aç.
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'student' | null
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [newExam, setNewExam] = useState({ title: '', date: '', description: '' });
  const [newNote, setNewNote] = useState({ title: '', file: null });
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isUploadingNote, setIsUploadingNote] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSavingExam, setIsSavingExam] = useState(false);
  const [examQuery, setExamQuery] = useState('');
  const [examFilter, setExamFilter] = useState('upcoming');
  const [configUrl, setConfigUrl] = useState(resolvedSupabaseUrl);
  const [configKey, setConfigKey] = useState(supabaseAnonKey);
  const [nowTick, setNowTick] = useState(new Date());
  const [noteVotes, setNoteVotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('note_votes') || '{}');
    } catch {
      return {};
    }
  });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState({ nick: 'Anonim Kazı Başkanı #000', ip: '0.0.0.0', color: '#3b82f6' });
  const [showRunnerGame, setShowRunnerGame] = useState(false);

  const getSupabaseHeaders = (preferRepresentation = false) => ({
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    ...(preferRepresentation ? { Prefer: 'return=representation' } : {}),
  });

  const fetchSupabaseExams = async () => {
    const [examRes, noteRes] = await Promise.all([
      fetch(`${resolvedSupabaseUrl}/rest/v1/exams?select=*&order=date.asc`, {
        method: 'GET',
        headers: getSupabaseHeaders(),
      }),
      fetch(`${resolvedSupabaseUrl}/rest/v1/notes?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: getSupabaseHeaders(),
      }),
    ]);

    if (!examRes.ok) {
      throw new Error(`Supabase exams fetch failed: ${examRes.status}`);
    }

    if (!noteRes.ok) {
      throw new Error(`Supabase notes fetch failed: ${noteRes.status}`);
    }

    const [examData, noteData] = await Promise.all([examRes.json(), noteRes.json()]);
    const notesByExam = (noteData || []).reduce((acc, note) => {
      const key = String(note.exam_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        id: String(note.id),
        title: note.title,
        file_url: note.file_url,
        file_name: note.file_name,
        date: note.created_at,
      });
      return acc;
    }, {});

    return (examData || []).map((exam) => ({
      id: String(exam.id),
      title: exam.title,
      date: exam.date,
      description: exam.description || '',
      notes: notesByExam[String(exam.id)] || [],
    }));
  };

  const uploadNoteFileToSupabase = async (file, onProgress) => {
    let safeName = trToEn(file.name);
    safeName = safeName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9.\-_]/g, '');
    const filePath = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${resolvedSupabaseUrl}/storage/v1/object/${supabaseBucket}/${filePath}`);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !onProgress) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Supabase storage upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Supabase storage upload failed: network error'));
      xhr.send(file);
    });

    return `${resolvedSupabaseUrl}/storage/v1/object/public/${supabaseBucket}/${filePath}`;
  };

  // Basit kullanıcı başlatma
  useEffect(() => {
    setUser({ uid: 'local-user' });
    if (!hasSupabaseConfig) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNowTick(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const generateStaticIdentity = (ip) => {
      let hash = 0;
      for (let i = 0; i < ip.length; i++) {
        hash = ip.charCodeAt(i) + ((hash << 5) - hash);
      }
      const absoluteHash = Math.abs(hash);
      const index = absoluteHash % archeoTitles.length;
      const id = absoluteHash % 1000;
      return {
        nick: `${archeoTitles[index]} #${id}`,
        color: `hsl(${absoluteHash % 360}, 70%, 45%)`,
      };
    };

    const initIdentity = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ip = data?.ip || '127.0.0.1';
        const identity = generateStaticIdentity(ip);
        setCurrentUser({ ip, ...identity });
      } catch {
        const ip = '127.0.0.1';
        const identity = generateStaticIdentity(ip);
        setCurrentUser({ ip, ...identity });
      }
    };

    initIdentity();
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !user) return;

    let mounted = true;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${resolvedSupabaseUrl}/rest/v1/messages?select=*&order=created_at.desc&limit=30`, {
          headers: getSupabaseHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setMessages((data || []).reverse());
      } catch {
        // sohbet hataları ana akışı bozmasın
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Veri Çekme
  useEffect(() => {
    if (!user) return;

    if (hasSupabaseConfig) {
      const fetchExams = async () => {
        try {
          const examData = await fetchSupabaseExams();
          setExams(examData);
        } catch (error) {
          console.error("Supabase error:", error);
          setStatusMessage('Supabase bağlantı hatası: Sınavlar yüklenemedi.');
        }
        setLoading(false);
      };

      fetchExams();
      return;
    }

    setExams([]);
    setLoading(false);
  }, [user]);

  const refreshSupabaseExams = async () => {
    if (!hasSupabaseConfig) return;
    try {
      const examData = await fetchSupabaseExams();
      setExams(examData);
    } catch (error) {
      console.error("Supabase refresh error:", error);
    }
  };

  // En yakın sınavı hesapla
  const nextExam = useMemo(() => {
    const now = new Date();
    const futureExams = exams
      .filter(e => new Date(e.date) >= now.setHours(0,0,0,0))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return futureExams[0] || null;
  }, [exams]);

  const daysToNextExam = useMemo(() => {
    if (!nextExam) return null;
    const target = new Date(nextExam.date);
    target.setHours(23, 59, 59, 999);
    const diff = target - nowTick;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return { days, hours, minutes };
  }, [nextExam, nowTick]);

  const getNoteScore = (noteId) => noteVotes[noteId] || 0;

  const handleVoteNote = (noteId) => {
    setNoteVotes((prev) => {
      const next = { ...prev, [noteId]: (prev[noteId] || 0) + 1 };
      localStorage.setItem('note_votes', JSON.stringify(next));
      return next;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !hasSupabaseConfig) return;

    try {
      setIsSendingMessage(true);
      const res = await fetch(`${resolvedSupabaseUrl}/rest/v1/messages`, {
        method: 'POST',
        headers: getSupabaseHeaders(true),
        body: JSON.stringify({
          content,
          color: currentUser.color,
          nickname: currentUser.nick,
        }),
      });
      if (!res.ok) throw new Error('Mesaj gönderilemedi');
      const inserted = await res.json();
      setMessages((prev) => [...prev, ...(inserted || [])]);
      setNewMessage('');
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const filteredExams = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    return exams.filter((exam) => {
      const matchesQuery = exam.title.toLowerCase().includes(examQuery.toLowerCase());
      const examTime = new Date(exam.date).getTime();
      const matchesFilter = examFilter === 'all'
        ? true
        : examFilter === 'past'
          ? examTime < todayStart
          : examTime >= todayStart;
      return matchesQuery && matchesFilter;
    });
  }, [exams, examQuery, examFilter]);

  // Takvim Yardımcıları
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Pzt=0 için ayarla
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!newExam.title || !newExam.date || role !== 'admin' || !user) return;

    try {
      setIsSavingExam(true);
      if (hasSupabaseConfig) {
        const res = await fetch(`${resolvedSupabaseUrl}/rest/v1/exams`, {
          method: 'POST',
          headers: getSupabaseHeaders(true),
          body: JSON.stringify({
            title: newExam.title,
            date: newExam.date,
            description: newExam.description,
          }),
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Supabase add exam failed (${res.status}): ${errorText}`);
        }
        await refreshSupabaseExams();
        setStatusMessage('Sınav başarıyla yayınlandı.');
      } else {
        setStatusMessage('Supabase ayarı eksik. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlayın.');
        return;
      }

      setIsAddModalOpen(false);
      setNewExam({ title: '', date: '', description: '' });
    } catch (err) {
      console.error("Error adding exam:", err);
      setStatusMessage(`Sınav yayınlanamadı: ${err.message}`);
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title || !newNote.file || !selectedExam || !user) return;

    try {
      if (hasSupabaseConfig) {
        setIsUploadingNote(true);
        setUploadProgress(0);
        const fileUrl = await uploadNoteFileToSupabase(newNote.file, setUploadProgress);
        const insertRes = await fetch(`${resolvedSupabaseUrl}/rest/v1/notes`, {
          method: 'POST',
          headers: getSupabaseHeaders(true),
          body: JSON.stringify({
            exam_id: Number(selectedExam.id),
            title: newNote.title,
            file_url: fileUrl,
            file_name: newNote.file.name,
          }),
        });

        if (!insertRes.ok) throw new Error(`Supabase add note row failed: ${insertRes.status}`);

        const [created] = await insertRes.json();
        const noteObj = {
          id: String(created.id),
          title: created.title,
          file_url: created.file_url,
          file_name: created.file_name,
          date: created.created_at,
        };

        setSelectedExam(prev => ({
          ...prev,
          notes: [...(prev.notes || []), noteObj]
        }));
        setExams((prevExams) =>
          prevExams.map((exam) =>
            exam.id === selectedExam.id
              ? { ...exam, notes: [...(exam.notes || []), noteObj] }
              : exam
          )
        );
        setStatusMessage('Not başarıyla yüklendi.');
      } else {
        setStatusMessage('Supabase ayarı eksik. Not yüklenemedi.');
        return;
      }
      setNewNote({ title: '', file: null });
      setUploadProgress(0);
    } catch (err) {
      console.error("Error adding note:", err);
      setStatusMessage(`Not yükleme hatası: ${err.message}`);
    } finally {
      setIsUploadingNote(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (role !== 'admin' || !hasSupabaseConfig || !examId) return;
    const approved = window.confirm('Bu sınavı silmek istediğinize emin misiniz?');
    if (!approved) return;

    try {
      const res = await fetch(`${resolvedSupabaseUrl}/rest/v1/exams?id=eq.${examId}`, {
        method: 'DELETE',
        headers: getSupabaseHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Supabase delete exam failed (${res.status}): ${errorText}`);
      }

      setExams((prevExams) => prevExams.filter((exam) => exam.id !== String(examId)));
      setSelectedExam(null);
      setStatusMessage('Sınav silindi.');
    } catch (err) {
      console.error('Error deleting exam:', err);
      setStatusMessage(`Sınav silinemedi: ${err.message}`);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (role !== 'admin' || !hasSupabaseConfig || !noteId || !selectedExam) return;
    const approved = window.confirm('Bu notu silmek istediğinize emin misiniz?');
    if (!approved) return;

    try {
      const res = await fetch(`${resolvedSupabaseUrl}/rest/v1/notes?id=eq.${noteId}`, {
        method: 'DELETE',
        headers: getSupabaseHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Supabase delete note failed (${res.status}): ${errorText}`);
      }

      setSelectedExam((prev) => prev ? ({
        ...prev,
        notes: (prev.notes || []).filter((note) => note.id !== String(noteId))
      }) : prev);
      setExams((prevExams) =>
        prevExams.map((exam) =>
          exam.id === selectedExam.id
            ? { ...exam, notes: (exam.notes || []).filter((note) => note.id !== String(noteId)) }
            : exam
        )
      );
      setStatusMessage('Not silindi.');
    } catch (err) {
      console.error('Error deleting note:', err);
      setStatusMessage(`Not silinemedi: ${err.message}`);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin4321') {
      setRole('admin');
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      setAdminPassword('');
    }
  };

  const handleSaveSupabaseConfig = (e) => {
    e.preventDefault();
    if (!configUrl || !configKey) return;
    localStorage.setItem('SUPABASE_URL', configUrl.trim());
    localStorage.setItem('SUPABASE_ANON_KEY', configKey.trim());
    window.location.reload();
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100 bg-gray-50/50"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayExams = exams.filter(e => e.date === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div key={d} className={`h-24 border border-gray-100 p-1 relative hover:bg-blue-50 transition-colors cursor-default ${isToday ? 'bg-blue-50/30' : ''}`}>
          <span className={`text-sm font-medium ${isToday ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-gray-500'}`}>
            {d}
          </span>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-16">
            {dayExams.map(exam => (
              <button
                key={exam.id}
                onClick={() => setSelectedExam(exam)}
                className="w-full text-left text-[10px] p-1 bg-white border border-blue-200 rounded text-blue-700 truncate hover:shadow-sm"
              >
                {exam.title}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 bg-blue-600 text-white rounded-3xl mb-6 shadow-xl shadow-blue-200">
              <BookOpen size={48} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">Sınav Takip Portalı</h1>
            <p className="text-slate-500 text-lg">Hoş geldiniz, devam etmek için giriş türünü seçin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={() => setRole('student')}
              className="group bg-white p-10 rounded-3xl border-2 border-transparent hover:border-blue-500 shadow-xl hover:shadow-2xl transition-all text-left flex flex-col items-center md:items-start"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <User size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Giriş Yap</h2>
              <p className="text-slate-500 mb-6">Sınav tarihlerine bakabilir ve ders notlarını paylaşabilirsiniz.</p>
              <span className="mt-auto text-blue-600 font-bold flex items-center gap-2">Devam Et <ChevronRight size={18} /></span>
            </button>

            <button 
              onClick={() => setShowAdminLogin(true)}
              className="group bg-white p-10 rounded-3xl border-2 border-transparent hover:border-indigo-500 shadow-xl hover:shadow-2xl transition-all text-left flex flex-col items-center md:items-start"
            >
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Paneli</h2>
              <p className="text-slate-500 mb-6">Sadece yetkili kullanıcılar içindir. Sınav ekleme ve yönetim yetkisi verir.</p>
              <span className="mt-auto text-indigo-600 font-bold flex items-center gap-2">Yönetime Geç <ChevronRight size={18} /></span>
            </button>
          </div>
        </div>

        {showAdminLogin && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="text-indigo-600" /> Admin Doğrulama</h3>
                <button onClick={() => setShowAdminLogin(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">Lütfen yönetici şifresini giriniz.</p>
                <input 
                  autoFocus
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Şifre"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
                  Giriş Yap
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <nav className="sticky top-4 mx-auto max-w-5xl z-40 bg-white/80 backdrop-blur-xl border border-white/20 shadow-sm rounded-2xl px-6 py-3 flex justify-between items-center transition-all mb-4">
        <div className="flex items-center gap-2 font-bold text-blue-600">
          <BookOpen size={24} />
          <span className="hidden md:inline">Sınav Takip</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
            {role === 'admin' ? <ShieldCheck size={14} /> : <User size={14} />}
            {role === 'admin' ? 'YÖNETİCİ' : 'ÖĞRENCİ'}
          </div>
          <button 
            onClick={() => { setRole(null); setSelectedExam(null); }}
            className="flex items-center gap-1 text-slate-500 hover:text-red-600 text-sm font-medium transition-colors"
          >
            <LogOut size={16} /> Çıkış
          </button>
        </div>
      </nav>

      <header
        className="text-white py-12 px-4 shadow-lg mb-8 bg-slate-700 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url('${bannerImageUrl}')` }}
      >
        <div className="max-w-5xl ml-0 mr-auto text-left">
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 md:p-6 inline-block w-1/2 md:w-auto border border-white/20">
            {nextExam ? (
              <div className="flex flex-col items-center">
                <span className="text-blue-100 text-sm uppercase tracking-widest font-semibold mb-1">En Yakın Sınav: {nextExam.title}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-black text-white">{daysToNextExam?.days}</span>
                  <span className="text-lg md:text-2xl font-light text-blue-100">gün</span>
                </div>
                <span className="text-xs md:text-sm text-blue-100 mt-1">
                  {daysToNextExam?.hours}s {daysToNextExam?.minutes}dk kaldı
                </span>
                <div className="mt-3 flex items-center gap-2 text-blue-200 text-sm">
                  <Clock size={16} />
                  <span>{new Date(nextExam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            ) : (
              <p className="text-lg text-blue-100">Planlanmış bir sınav yok. 🎉</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(statusMessage || !hasSupabaseConfig) && (
          <div className="lg:col-span-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
            {statusMessage || 'Supabase ayarı eksik. Aşağıdan URL ve ANON KEY kaydedin.'}
          </div>
        )}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800">
                {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-white rounded transition-all"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-white rounded transition-all"><ChevronRight size={20}/></button>
                <button onClick={() => setCurrentDate(new Date())} className="px-2 text-xs font-semibold hover:bg-white rounded transition-all">Bu Ay</button>
              </div>
            </div>
            
            {role === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md"
              >
                <Plus size={18} />
                Yeni Sınav
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-7 text-center border-b border-slate-100 bg-slate-50/50">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
              <div key={day} className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 auto-rows-fr">
            {renderCalendarDays()}
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CalendarIcon size={20} className="text-blue-600" />
              Yaklaşan Sınavlar
            </h3>
            <div className="mb-4 space-y-3">
              <input
                type="text"
                value={examQuery}
                onChange={(e) => setExamQuery(e.target.value)}
                placeholder="Sınav ara..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm"
              />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button onClick={() => setExamFilter('upcoming')} className={`px-2 py-2 rounded-lg font-semibold ${examFilter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Yaklaşan</button>
                <button onClick={() => setExamFilter('all')} className={`px-2 py-2 rounded-lg font-semibold ${examFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Tümü</button>
                <button onClick={() => setExamFilter('past')} className={`px-2 py-2 rounded-lg font-semibold ${examFilter === 'past' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Geçmiş</button>
              </div>
            </div>
            <div className="space-y-3">
              {filteredExams
                .sort((a,b) => new Date(a.date) - new Date(b.date))
                .slice(0, 8)
                .map(exam => (
                  <div 
                    key={exam.id} 
                    onClick={() => setSelectedExam(exam)}
                    className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 group-hover:text-blue-700">{exam.title}</span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full uppercase tracking-tighter">
                        {Math.ceil((new Date(exam.date) - new Date()) / (1000 * 60 * 60 * 24))} Gün
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</p>
                  </div>
                ))}
              {filteredExams.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Aramana uygun sınav bulunamadı.</p>}
            </div>
          </div>
        </section>
      </main>

      {isAddModalOpen && role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="text-xl font-bold text-indigo-900">Sınav Tanımla</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleAddExam} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ders Adı</label>
                <input required type="text" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none" placeholder="Örn: Fizik-101"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tarih</label>
                <input required type="date" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Detaylar</label>
                <textarea value={newExam.description} onChange={e => setNewExam({...newExam, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none h-24 resize-none" placeholder="Sınav kapsamı..."/>
              </div>
              <button disabled={isSavingExam} type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-60">
                {isSavingExam ? 'Yayınlanıyor...' : 'Sınavı Yayınla'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-blue-50">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{new Date(selectedExam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <h3 className="text-2xl font-bold text-slate-900">{selectedExam.title}</h3>
                {selectedExam.description && <p className="text-slate-600 mt-1">{selectedExam.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                {role === 'admin' && (
                  <button
                    onClick={() => handleDeleteExam(selectedExam.id)}
                    className="text-red-600 hover:text-red-700 bg-white p-2 rounded-full border border-red-100"
                    title="Sınavı Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={() => setSelectedExam(null)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full"><X /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-bold flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Paylaşılan Notlar</h4>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {selectedExam.notes && selectedExam.notes.length > 0 ? (
                    [...selectedExam.notes]
                      .sort((a, b) => getNoteScore(b.id) - getNoteScore(a.id))
                      .map(note => (
                      <div key={note.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                        <h5 className="font-bold text-slate-800">{note.title}</h5>
                        {note.file_url && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(note.file_name || '') && (
                          <img
                            src={note.file_url}
                            alt={note.title}
                            className="mt-2 w-full h-28 object-cover rounded-lg border border-slate-200"
                          />
                        )}
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                          {note.file_name || note.content}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{new Date(note.date).toLocaleDateString('tr-TR')}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVoteNote(note.id)}
                              className="flex items-center gap-1 text-emerald-600 font-bold"
                              title="Notu beğen"
                            >
                              <ThumbsUp size={12} /> {getNoteScore(note.id)}
                            </button>
                            {note.file_url ? (
                              <a
                                href={note.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-blue-600 font-bold"
                              >
                                <Download size={12} /> İndir
                              </a>
                            ) : (
                              <span className="text-slate-300">Dosya yok</span>
                            )}
                            {role === 'admin' && (
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-red-600 font-bold"
                                title="Notu sil"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-6 border border-dashed rounded-xl">Henüz not yok.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-bold flex items-center gap-2"><Upload size={20} className="text-blue-600" /> Not Yükle</h4>
                <form onSubmit={handleAddNote} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <input required type="text" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none text-sm" placeholder="Not başlığı"/>
                  <input
                    required
                    type="file"
                    onChange={e => setNewNote({ ...newNote, file: e.target.files?.[0] || null })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none text-sm bg-white"
                  />
                  {isUploadingNote && (
                    <div className="space-y-2">
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 text-right">%{uploadProgress}</p>
                    </div>
                  )}
                  <button disabled={isUploadingNote} type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all text-sm disabled:opacity-60">
                    {isUploadingNote ? 'Yükleniyor...' : 'Notu Paylaş'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasSupabaseConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Supabase Bağlantı Ayarları</h3>
            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
              <input
                type="url"
                required
                value={configUrl}
                onChange={(e) => setConfigUrl(e.target.value)}
                placeholder="https://xxxx.supabase.co"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
              />
              <input
                type="text"
                required
                value={configKey}
                onChange={(e) => setConfigKey(e.target.value)}
                placeholder="supabase anon key"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
              />
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
                Ayarları Kaydet ve Yenile
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 w-80">
        {isChatOpen ? (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-96">
            <div className="p-4 border-b border-slate-100 bg-blue-600 text-white flex justify-between items-center">
              <span className="font-bold text-sm">Agora (Sohbet)</span>
              <button onClick={() => setIsChatOpen(false)} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                Kapat
              </button>
            </div>

            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col">
                    <span className="text-[10px] font-bold mb-0.5" style={{ color: msg.color }}>{msg.nickname}</span>
                    <div className="bg-white border border-slate-100 p-2 rounded-2xl rounded-tl-none text-xs shadow-sm">
                      {msg.content}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-xs text-slate-400 text-center">Henüz mesaj yok.</p>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Bir şeyler yaz..."
                  className="flex-1 bg-slate-100 border-none rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button disabled={isSendingMessage} type="submit" className="bg-blue-600 text-white p-2 rounded-xl disabled:opacity-60">
                  <Plus size={16} />
                </button>
              </form>
              <div className="px-3 pb-2 text-[10px] text-slate-400 truncate">
                Kimlik: <span style={{ color: currentUser.color }}>{currentUser.nick}</span>
              </div>
            </>
          </div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="ml-auto w-auto bg-blue-600 text-white px-4 py-3 rounded-full shadow-xl text-sm font-semibold"
          >
            💬 Sohbeti Aç
          </button>
        )}
      </div>

      <button
        onClick={() => setShowRunnerGame(true)}
        className="fixed bottom-6 left-6 z-[65] bg-emerald-600 text-white px-4 py-3 rounded-full shadow-2xl text-sm font-semibold"
      >
        🎮 Oyun Oyna
      </button>

      {showRunnerGame && <RunnerGameModal onClose={() => setShowRunnerGame(false)} />}
    </div>
  );
}
