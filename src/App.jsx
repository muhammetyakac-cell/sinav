import React, { useState, useEffect, useMemo } from 'react';
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
const WEEKLY_QUESTIONS = [
  { id: 1, q: 'Neolitik Devrim kavramını ilk ortaya atan bilim insanı?', options: ['Lewis Binford', 'V. Gordon Childe', 'Ian Hodder', 'Robert Braidwood'], a: 1 },
  { id: 2, q: 'Obsidiyen ticaret merkezi sayılan Neolitik yerleşim?', options: ['Çayönü', 'Aşıklı Höyük', 'Hacılar', 'Hallan Çemi'], a: 1 },
  { id: 3, q: 'Göbeklitepe T biçimli dikilitaş üslubu?', options: ['Epipaleolitik / Çanak Çömleksiz Neolitik A', 'Geç Neolitik', 'Kalkolitik', 'Erken Tunç Çağı'], a: 0 },
  { id: 4, q: 'Mezopotamya’da yazının ilk kez kullanıldığı dönem?', options: ['Ubeyd', 'Uruk', 'Cemdet Nasr', 'Akad'], a: 1 },
  { id: 5, q: 'Kültepe tabletleri neden dönüm noktasıdır?', options: ['İlk tapınak planları', 'Anadolu’nun yazılı tarihe geçişi', 'Hitit başkentini belirtmesi', 'Demir kullanımını tarif etmesi'], a: 1 },
  { id: 6, q: 'Hitit soylular meclisi?', options: ['Tavananna', 'Pankuş', 'Labarna', 'Ziti'], a: 1 },
  { id: 7, q: 'Tuşpa günümüzde hangi şehir?', options: ['Erzurum', 'Van', 'Kars', 'Erzincan'], a: 1 },
  { id: 8, q: 'Frig ahşap işçiliği geçme tekniği?', options: ['Fibula', 'Tümülüs', 'Mevduat', 'Kakmacılık / Kündekari'], a: 3 },
  { id: 9, q: 'Sardes ilk sikkelerin temel amacı?', options: ['Halkın zenginleşmesi', 'Paralı asker ödemelerini standartlaştırmak', 'Dış ticareti durdurmak', 'Tapınak vergisi toplamak'], a: 1 },
  { id: 10, q: 'Geç Hitit giriş koruyucu aslan/sfenks heykelleri?', options: ['Megaron', 'Ortostat', 'Stela', 'Karum'], a: 1 },
  { id: 11, q: 'Yunan tapınakta sütun başlığı üstündeki yatay öğe?', options: ['Arşitrav (Epistil)', 'Friz', 'Geison', 'Timpanon'], a: 0 },
  { id: 12, q: 'Dor düzeninde metoplar arasındaki bölüm?', options: ['Volüt', 'Triglif', 'Abakus', 'Echinus'], a: 1 },
  { id: 13, q: 'Kontrapostun erken ünlü örneği?', options: ['Kouros', 'Kritios Oğlu', 'Doryphoros', 'Laocoön'], a: 1 },
  { id: 14, q: 'Helenistik dönem başlangıcı?', options: ['Peloponnesos sonu', 'Büyük İskender’in ölümü', 'Augustus imparatorluğu', 'Pers işgali'], a: 1 },
  { id: 15, q: 'Roma antik beton adı?', options: ['Opus Reticulatum', 'Opus Caementicium', 'Opus Sectile', 'Opus Tessellatum'], a: 1 },
  { id: 16, q: 'Roma tiyatrosunda seyirci bölümü?', options: ['Orchestra', 'Skene', 'Cavea', 'Vomitorium'], a: 2 },
  { id: 17, q: 'Karyatidli tapınak?', options: ['Parthenon', 'Erechtheion', 'Nike Tapınağı', 'Propylaia'], a: 1 },
  { id: 18, q: 'Roma şehir planında kuzey-güney ana cadde?', options: ['Decumanus Maximus', 'Cardo Maximus', 'Forum', 'Insula'], a: 1 },
  { id: 19, q: 'Siyah figürden kırmızı figüre geçiş?', options: ['MÖ 7. yy sonu', 'MÖ 530 civarı', 'MÖ 4. yy', 'MS 1. yy'], a: 1 },
  { id: 20, q: 'Pompeii illüzyonist üslup kaçıncı stil?', options: ['1. Stil', '2. Stil', '3. Stil', '4. Stil'], a: 1 },
  { id: 21, q: 'Tabakalaşma yasasına göre en alt tabaka?', options: ['En modern', 'En eski', 'Tarihlendirilemez', 'Kesin Roma'], a: 1 },
  { id: 22, q: 'Dendrokronoloji hangi materyal?', options: ['Kemik', 'Seramik', 'Ağaç halkaları', 'Taş'], a: 2 },
  { id: 23, q: 'C14 sağlıklı üst limit?', options: ['5.000 yıl', '50.000-60.000 yıl', '1 milyon yıl', '10 milyon yıl'], a: 1 },
  { id: 24, q: 'Süreçsel arkeoloji öncüsü?', options: ['Ian Hodder', 'Lewis Binford', 'Schliemann', 'Arthur Evans'], a: 1 },
  { id: 25, q: 'Yüzeyde seramik yoğunluğu ile sınır belirleme?', options: ['Sondaj', 'Survey', 'Stratigrafi', 'Tipoloji'], a: 1 },
  { id: 26, q: 'Planlı yonga çıkarma tekniği?', options: ['Levallois', 'El baltası', 'Mikrolit', 'Baskı'], a: 0 },
  { id: 27, q: 'In-situ ne demek?', options: ['Lab ortamı', 'Orijinal konum', 'Sahte', 'Dağınık yüzey malzemesi'], a: 1 },
  { id: 28, q: 'Su altı arkeolojisinin babası?', options: ['Robert Ballard', 'George Bass', 'Jacques Cousteau', 'Cemal Pulak'], a: 1 },
  { id: 29, q: 'Seramik form/bezeme gruplandırması?', options: ['Epigrafi', 'Tipoloji', 'Numismatik', 'Antropoloji'], a: 1 },
  { id: 30, q: 'Post-süreçselin önemli savunucusu?', options: ['James Mellaart', 'Ian Hodder', 'Colin Renfrew', 'Michael Schiffer'], a: 1 },
  { id: 31, q: 'Hermes’in Roma karşılığı?', options: ['Mars', 'Merkür', 'Neptün', 'Jüpiter'], a: 1 },
  { id: 32, q: 'Sikke üzerindeki yazılar?', options: ['Epigraf', 'Lejand', 'Kabartma', 'Mühür'], a: 1 },
  { id: 33, q: 'Sikkenin ön yüzü?', options: ['Revers', 'Avers', 'Exergue', 'Kondisyon'], a: 1 },
  { id: 34, q: 'Epigrafi neyi inceler?', options: ['Sikkeler', 'Taş/sert yüzey yazıtları', 'Papirüs', 'El yazmaları'], a: 1 },
  { id: 35, q: 'Truva kazılarını başlatan tartışmalı isim?', options: ['Dörpfeld', 'Heinrich Schliemann', 'Korfmann', 'Blegen'], a: 1 },
  { id: 36, q: 'Anadolu’da en eski yerleşik köy?', options: ['Çatalhöyük', 'Hallan Çemi', 'Çayönü', 'Göbeklitepe'], a: 1 },
  { id: 37, q: 'Bouleuterion ne için?', options: ['Ticaret merkezi', 'Meclis binası', 'Hamam', 'Kütüphane'], a: 1 },
  { id: 38, q: 'Myken bindirme kubbeli mezar?', options: ['Tümülüs', 'Tholos', 'Lahit', 'Kurgan'], a: 1 },
  { id: 39, q: 'Efes’te 7 harikadan biri?', options: ['Celsus Kütüphanesi', 'Hadrian Tapınağı', 'Artemis Tapınağı', 'Büyük Tiyatro'], a: 2 },
  { id: 40, q: 'Antik tiyatroda koronun alanı?', options: ['Parodos', 'Orchestra', 'Diazoma', 'Analemma'], a: 1 },
  { id: 41, q: 'Seramikte kırmızı/siyah renk süreci neyle ilgili?', options: ['Kireç miktarı', 'Demir oksit oranı', '1500°C üstü', 'Yoğrulma biçimi'], a: 1 },
  { id: 42, q: 'Arkaik dönem erkek heykelleri?', options: ['Atlant', 'Kouros', 'Herm', 'Stele'], a: 1 },
  { id: 43, q: 'Res Gestae tam kopyası Türkiye’de nerede?', options: ['Ankara', 'Antalya', 'İzmir', 'Aydın'], a: 0 },
  { id: 44, q: 'Sütun gövdesindeki dikey yivler?', options: ['Abakus', 'Kanelür', 'Sütun tamburu', 'Stylobat'], a: 1 },
  { id: 45, q: 'Peripteros planlı tapınak?', options: ['Önde iki sütun', 'Ön-arka sütun', 'Dört yanı tek sıra sütun', 'Dört yanı çift sıra sütun'], a: 2 },
  { id: 46, q: 'Helenistik barok üslup en iyi hangi ekol?', options: ['Rodos', 'Bergama', 'İskenderiye', 'Atina'], a: 1 },
  { id: 47, q: 'Kültepe kazıları hangi bilim insanı?', options: ['Ekrem Akurgal', 'Tahsin Özgüç', 'Halet Çambel', 'Muhibbe Darga'], a: 1 },
  { id: 48, q: 'Bizans kubbeyi kareye oturtan öğe?', options: ['Tonoz', 'Pandantif', 'Apsis', 'Narteks'], a: 1 },
  { id: 49, q: 'Paleolitik mağara resimlerinde yaygın teori?', options: ['Dekorasyon', 'Av büyüsü/ritüel', 'Ticari kayıt', 'Sınır'], a: 1 },
  { id: 50, q: 'UNESCO güncel eklenenlerden arkeolojik alan?', options: ['Gordion', 'Ani', 'Afrodisias', 'Bergama'], a: 0 },
];
const trToEn = (str) => {
  const mapping = {
    'Ğ': 'G', 'ğ': 'g', 'Ü': 'U', 'ü': 'u', 'Ş': 'S', 'ş': 's',
    'İ': 'I', 'ı': 'i', 'Ö': 'O', 'ö': 'o', 'Ç': 'C', 'ç': 'c'
  };
  return str.replace(/[ĞğÜüŞşİıÖöÇç]/g, (letter) => mapping[letter]);
};

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'student' | null
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isQuizOpen, setIsQuizOpen] = useState(false);
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
  const [quizSet, setQuizSet] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

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

  const startWeeklyTest = () => {
    const shuffled = [...WEEKLY_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuizSet(shuffled);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setIsQuizOpen(true);
  };

  const submitWeeklyTest = () => {
    if (quizSet.length === 0) return;
    if (Object.keys(quizAnswers).length !== quizSet.length) {
      setStatusMessage('Lütfen tüm soruları cevaplayın.');
      return;
    }
    let correct = 0;
    quizSet.forEach((q) => {
      if (quizAnswers[q.id] === q.a) correct += 1;
    });
    setQuizScore(correct * 10);
    setQuizSubmitted(true);
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
        onClick={startWeeklyTest}
        className="fixed bottom-6 left-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-xl text-sm font-semibold md:text-base"
      >
        📝 Haftalık Test
      </button>

      {isQuizOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">Haftalık Arkeoloji Testi (10 Soru)</h3>
              <button onClick={() => setIsQuizOpen(false)} className="text-slate-500 hover:text-slate-800">Kapat</button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-5">
              {quizSet.map((item, idx) => (
                <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="font-semibold mb-3">{idx + 1}. {item.q}</p>
                  <div className="space-y-2">
                    {item.options.map((opt, optIdx) => (
                      <label key={optIdx} className="flex items-start gap-2 text-sm">
                        <input
                          type="radio"
                          name={`q-${item.id}`}
                          checked={quizAnswers[item.id] === optIdx}
                          onChange={() => setQuizAnswers((prev) => ({ ...prev, [item.id]: optIdx }))}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {quizSubmitted && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 font-semibold">
                  Puanın: {quizScore}/100 ({quizScore / 10} doğru / 10)
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={submitWeeklyTest} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold">
                Testi Bitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
