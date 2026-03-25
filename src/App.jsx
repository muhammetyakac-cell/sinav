import React, { useState, useEffect, useMemo } from 'react';
// Supabase kütüphanesini doğrudan CDN üzerinden içe aktararak derleme hatasını gideriyoruz
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
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
  ShieldCheck,
  FileUp,
  Loader2,
  AlertCircle
} from 'lucide-react';

/**
 * SUPABASE YAPILANDIRMASI
 * Sağladığın anahtarlar buraya entegre edildi.
 */
const supabaseUrl = "https://phicbgmciqrfeuwbnlrv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaWNiZ21jaXFyZmV1d2JubHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjQxMDAsImV4cCI6MjA5MDA0MDEwMH0.6Wx-yAccwOpklSjWBz6dzS3M2awLcxId4eXBA5H2NFI";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [role, setRole] = useState(null); // 'admin' | 'student' | null
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [newExam, setNewExam] = useState({ title: '', date: '', description: '' });
  
  const [uploading, setUploading] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', file: null });
  
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Veri Çekme (Supabase Database)
  useEffect(() => {
    const fetchExams = async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*, notes(*)');
      
      if (!error) setExams(data);
      setLoading(false);
    };

    fetchExams();

    // Gerçek zamanlı güncellemeler
    const subscription = supabase
      .channel('public:exams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, fetchExams)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  // Geri sayım hesaplama
  const nextExam = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const futureExams = exams
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return futureExams[0] || null;
  }, [exams]);

  const daysToNextExam = useMemo(() => {
    if (!nextExam) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = new Date(nextExam.date) - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [nextExam]);

  // Sınav Ekleme (Admin Yetkisi)
  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!newExam.title || !newExam.date || role !== 'admin') return;

    const { error } = await supabase
      .from('exams')
      .insert([newExam]);
    
    if (error) {
      console.error(error);
    } else {
      setIsAddModalOpen(false);
      setNewExam({ title: '', date: '', description: '' });
    }
  };

  // Not Yükleme (Supabase Storage + Database)
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title || !newNote.file || !selectedExam) return;

    setUploading(true);
    try {
      const fileExt = newNote.file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${selectedExam.id}/${fileName}`;

      // 1. Storage bucket'a yükle ('notes' bucket'ı panelden Public olarak oluşturulmalı)
      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, newNote.file);

      if (uploadError) throw uploadError;

      // 2. Genel erişim URL'ini al
      const { data: { publicUrl } } = supabase.storage
        .from('notes')
        .getPublicUrl(filePath);

      // 3. Veritabanına not bilgisini ekle
      const { error: dbError } = await supabase
        .from('notes')
        .insert([{
          exam_id: selectedExam.id,
          title: newNote.title,
          file_url: publicUrl,
          file_name: newNote.file.name
        }]);
      
      if (dbError) throw dbError;
      
      setNewNote({ title: '', file: null });
    } catch (err) {
      console.error("Yükleme hatası:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setRole('admin');
      setShowAdminLogin(false);
    }
    setAdminPassword('');
  };

  // Takvim Yardımcıları
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDay = (y, m) => {
    const d = new Date(y, m, 1).getDay();
    return d === 0 ? 6 : d - 1; // Pazartesi başlangıçlı
  };

  const renderCalendar = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const days = [];
    const total = daysInMonth(y, m);
    const start = firstDay(y, m);

    for (let i = 0; i < start; i++) days.push(<div key={`e-${i}`} className="h-24 border border-slate-50 bg-slate-50/20"></div>);
    for (let d = 1; d <= total; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayExams = exams.filter(e => e.date === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div key={d} className={`h-24 border border-slate-100 p-1 relative hover:bg-blue-50/50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
          <span className={`text-[10px] font-bold ${isToday ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>
            {d}
          </span>
          <div className="mt-1 space-y-1 overflow-hidden">
            {dayExams.map(ex => (
              <button 
                key={ex.id} 
                onClick={() => setSelectedExam(ex)}
                className="w-full text-[9px] text-left p-1 bg-white border border-blue-200 rounded text-blue-700 truncate shadow-sm hover:shadow-md transition-shadow"
              >
                {ex.title}
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
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-100">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200">
            <BookOpen size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Sınav Portalı</h1>
          <p className="text-slate-400 text-sm mb-12">Supabase Storage ile notlarınızı güvenle saklayın.</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => setRole('student')}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-95"
            >
              <User size={20} /> Öğrenci Olarak Giriş
            </button>
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="w-full bg-white border-2 border-slate-100 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Lock size={20} /> Admin Paneli
            </button>
          </div>
        </div>

        {showAdminLogin && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Yönetici Girişi</h3>
                <button onClick={() => setShowAdminLogin(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Admin Şifresi</label>
                  <input 
                    type="password" 
                    autoFocus
                    placeholder="Varsayılan: admin123" 
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg">Giriş Yap</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-100">
            <BookOpen size={20} />
          </div>
          <span className="font-black text-slate-800 tracking-tight">SINAV TAKİP</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter ${role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {role === 'admin' ? 'YÖNETİCİ MODU' : 'ÖĞRENCİ MODU'}
          </div>
          <button onClick={() => setRole(null)} className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors text-sm font-bold">
            <LogOut size={16} /> <span className="hidden md:inline">Çıkış</span>
          </button>
        </div>
      </nav>

      {/* Countdown Hero */}
      <header className="bg-slate-900 text-white py-16 px-4 mb-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-10 left-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
           <div className="absolute bottom-10 right-10 w-60 h-60 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 inline-block shadow-2xl">
            {nextExam ? (
              <div className="flex flex-col items-center">
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{nextExam.title}</span>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-7xl font-black leading-none">{daysToNextExam}</span>
                    <span className="text-xs font-bold text-slate-500 mt-2 uppercase">Gün Kaldı</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic text-sm">Yakın zamanda planlanmış bir sınav bulunmuyor.</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Calendar Section */}
        <section className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-6">
              <h2 className="font-black text-slate-900 text-xl capitalize">{currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h2>
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft size={18}/></button>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight size={18}/></button>
              </div>
            </div>
            {role === 'admin' && (
              <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                <Plus size={18}/> Sınav Planla
              </button>
            )}
          </div>
          <div className="grid grid-cols-7 text-center bg-slate-50/50 py-3 border-b border-slate-50">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => <div key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr">
            {renderCalendar()}
          </div>
        </section>

        {/* List Section */}
        <section className="space-y-8">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
            <h3 className="font-black text-slate-900 flex items-center gap-3 mb-8"><CalendarIcon className="text-blue-600" size={22}/> Yaklaşanlar</h3>
            <div className="space-y-4">
              {exams.length > 0 ? exams
                .filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0))
                .sort((a,b) => new Date(a.date) - new Date(b.date))
                .map(ex => (
                <div 
                  key={ex.id} 
                  onClick={() => setSelectedExam(ex)} 
                  className="p-5 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/20 cursor-pointer transition-all group flex items-center justify-between"
                >
                  <div className="overflow-hidden">
                    <span className="block font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors truncate">{ex.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(ex.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400" />
                </div>
              )) : <p className="text-center text-slate-400 text-xs py-12 italic">Henüz sınav girilmemiş.</p>}
            </div>
          </div>
        </section>
      </main>

      {/* Admin Add Exam Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Yeni Sınav</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleAddExam} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ders Adı</label>
                <input required type="text" placeholder="Matematik, Fizik vb." value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Sınav Tarihi</label>
                <input required type="date" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ek Detaylar</label>
                <textarea placeholder="Konular, mekan bilgisi..." value={newExam.description} onChange={e => setNewExam({...newExam, description: e.target.value})} className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 h-28 resize-none" />
              </div>
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Takvime İşle</button>
            </form>
          </div>
        </div>
      )}

      {/* Details & Storage Modal */}
      {selectedExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
            <div className="p-10 border-b border-slate-50 bg-slate-50/30">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">{new Date(selectedExam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{selectedExam.title}</h3>
                </div>
                <button onClick={() => setSelectedExam(null)} className="p-3 hover:bg-white rounded-full transition-all shadow-sm"><X /></button>
              </div>
              <p className="text-slate-500 mt-6 text-sm leading-relaxed max-w-xl">{selectedExam.description || "Bu sınav için ek bir açıklama girilmemiş."}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Not Listesi */}
              <div>
                <h4 className="font-black text-slate-900 flex items-center gap-3 mb-6 text-lg"><FileText size={20} className="text-blue-600"/> Dökümanlar</h4>
                <div className="space-y-4">
                  {selectedExam.notes?.length > 0 ? selectedExam.notes.map(note => (
                    <div key={note.id} className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
                      <div className="overflow-hidden mr-4">
                        <p className="font-bold text-sm text-slate-800 truncate">{note.title}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-1">{note.file_name}</p>
                      </div>
                      <a 
                        href={note.file_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shrink-0"
                        title="İndir"
                      >
                        <Download size={18}/>
                      </a>
                    </div>
                  )) : (
                    <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                       <FileUp size={32} className="mx-auto text-slate-200 mb-4" />
                       <p className="text-xs text-slate-400 font-medium">Henüz dosya paylaşılmadı.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Yükleme Formu */}
              <div>
                <h4 className="font-black text-slate-900 flex items-center gap-3 mb-6 text-lg"><Upload size={20} className="text-blue-600"/> Not Paylaş</h4>
                <form onSubmit={handleAddNote} className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Not Başlığı</label>
                    <input required placeholder="Konu Özetleri, Formüller vb." value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  
                  <div className="relative h-28 border-2 border-dashed border-slate-200 rounded-[1.5rem] flex items-center justify-center hover:border-blue-400 transition-colors group bg-white">
                    <input required type="file" onChange={e => setNewNote({...newNote, file: e.target.files[0]})} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="text-center p-4">
                      <FileUp size={24} className="mx-auto text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
                      <p className="text-[10px] text-slate-500 truncate px-2 font-medium">
                        {newNote.file ? <span className="text-blue-600 font-bold">{newNote.file.name}</span> : "Dosya Seç veya Sürükle"}
                      </p>
                    </div>
                  </div>

                  <button 
                    disabled={uploading} 
                    className="w-full bg-slate-900 text-white py-4 rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95"
                  >
                    {uploading ? <><Loader2 size={16} className="animate-spin"/> Yükleniyor...</> : "Supabase'e Gönder"}
                  </button>
                </form>
                <p className="text-[10px] text-slate-400 mt-4 text-center">Maksimum dosya boyutu 50MB.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
