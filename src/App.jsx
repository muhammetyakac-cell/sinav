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
  X,
  BookOpen,
  Lock,
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';

// Supabase Yapılandırması
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
const supabaseBucket = 'notes';

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

  const getSupabaseHeaders = (preferRepresentation = false) => ({
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    ...(preferRepresentation ? { Prefer: 'return=representation' } : {}),
  });

  const fetchSupabaseExams = async () => {
    const [examRes, noteRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/exams?select=*&order=date.asc`, {
        method: 'GET',
        headers: getSupabaseHeaders(),
      }),
      fetch(`${supabaseUrl}/rest/v1/notes?select=*&order=created_at.desc`, {
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

  const uploadNoteFileToSupabase = async (file) => {
    const safeName = file.name.replace(/\s+/g, '_');
    const filePath = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${supabaseBucket}/${filePath}`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'x-upsert': 'false',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Supabase storage upload failed: ${uploadRes.status}`);
    }

    return `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${filePath}`;
  };

  // Basit kullanıcı başlatma
  useEffect(() => {
    setUser({ uid: 'local-user' });
    if (!hasSupabaseConfig) {
      setLoading(false);
    }
  }, []);

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
    const diff = new Date(nextExam.date) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  }, [nextExam]);

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
      if (hasSupabaseConfig) {
        const res = await fetch(`${supabaseUrl}/rest/v1/exams`, {
          method: 'POST',
          headers: getSupabaseHeaders(true),
          body: JSON.stringify({
            title: newExam.title,
            date: newExam.date,
            description: newExam.description,
          }),
        });
        if (!res.ok) throw new Error(`Supabase add exam failed: ${res.status}`);
        await refreshSupabaseExams();
      } else {
        return;
      }

      setIsAddModalOpen(false);
      setNewExam({ title: '', date: '', description: '' });
    } catch (err) {
      console.error("Error adding exam:", err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title || !newNote.file || !selectedExam || !user) return;

    try {
      if (hasSupabaseConfig) {
        const fileUrl = await uploadNoteFileToSupabase(newNote.file);
        const insertRes = await fetch(`${supabaseUrl}/rest/v1/notes`, {
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
      } else {
        return;
      }
      setNewNote({ title: '', file: null });
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setRole('admin');
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      setAdminPassword('');
    }
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
                <p className="text-sm text-slate-500 mb-4">Lütfen yönetici şifresini giriniz (Varsayılan: admin123)</p>
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
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
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

      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-12 px-4 shadow-lg mb-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 inline-block border border-white/20">
            {nextExam ? (
              <div className="flex flex-col items-center">
                <span className="text-blue-100 text-sm uppercase tracking-widest font-semibold mb-1">En Yakın Sınav: {nextExam.title}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{daysToNextExam}</span>
                  <span className="text-2xl font-light text-blue-100">gün kaldı</span>
                </div>
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
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800">
                {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-white rounded transition-all"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-white rounded transition-all"><ChevronRight size={20}/></button>
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
            <div className="space-y-3">
              {exams
                .filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0))
                .sort((a,b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5)
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
              {exams.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Sınav bulunamadı.</p>}
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
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all">Sınavı Yayınla</button>
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
              <button onClick={() => setSelectedExam(null)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full"><X /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-bold flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Paylaşılan Notlar</h4>
                <div className="space-y-3">
                  {selectedExam.notes && selectedExam.notes.length > 0 ? (
                    selectedExam.notes.map(note => (
                      <div key={note.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                        <h5 className="font-bold text-slate-800">{note.title}</h5>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                          {note.file_name || note.content}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{new Date(note.date).toLocaleDateString('tr-TR')}</span>
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
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all text-sm">Notu Paylaş</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
