import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import SendIcon from '@mui/icons-material/Send';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MapIcon from '@mui/icons-material/Map';
import StoreIcon from '@mui/icons-material/Store';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CakeIcon from '@mui/icons-material/Cake';
import SchoolIcon from '@mui/icons-material/School';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import gsap from 'gsap';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useAppDispatch } from '@store/hooks';
import { addItem } from '@store/slices/cartSlice';
import apiClient from '@services/api/client';

/* ───── Types ───── */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: any[];
  nearbyStores?: any[];
  followUpQuestions?: string[];
  analysisComplete?: boolean;
  timestamp: number;
}

interface RecipientForm {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: string;
  education: string;
  hobbies: string[];
  occasion: string;
  giftDate: string;
  budgetMin: number;
  budgetMax: number;
  relationship: string;
}

interface PastGift {
  id?: string;
  productName: string;
  productThumbnail?: string;
  price?: number;
  occasion: string;
  giftDate: string;
  reason?: string;
  rating?: number;
}

interface AIChatSummary {
  messages: { role: 'user' | 'assistant'; content: string }[];
  aiInsights?: string;
  savedAt: number;
}

interface SavedRecipient {
  id: string;
  form: RecipientForm;
  savedAt: number;
  giftHistory?: PastGift[];
  lastChat?: AIChatSummary;
}

/* ───── Constants ───── */
const STORAGE_KEY = 'gift_recipients';

const HOBBY_OPTIONS = [
  'Teknoloji', 'Spor', 'Müzik', 'Okuma', 'Yemek & Mutfak', 'Moda & Giyim',
  'Seyahat', 'Oyun', 'Sanat', 'Fotoğrafçılık', 'Bahçe & Doğa', 'Film & Dizi',
  'Yoga & Meditasyon', 'Koleksiyon', 'El İşi & DIY', 'Dans',
];

const OCCASION_OPTIONS = [
  'Doğum Günü', 'Yıldönümü', 'Yeni Yıl', 'Sevgililer Günü', 'Anneler Günü',
  'Babalar Günü', 'Mezuniyet', 'Düğün / Nişan', 'Terfi / İş Başarısı',
  'Ev Hediyesi', 'Veda / Ayrılık', 'Teşekkür', 'Bayram', 'Özel Bir Neden Yok',
];

const RELATIONSHIP_OPTIONS = [
  'Anne', 'Baba', 'Eş / Partner', 'Erkek Arkadaş', 'Kız Arkadaş',
  'Kardeş', 'Çocuk', 'Arkadaş', 'İş Arkadaşı', 'Öğretmen',
  'Komşu', 'Akraba', 'Patron / Yönetici', 'Diğer',
];

const EDUCATION_OPTIONS = [
  'İlkokul', 'Ortaokul', 'Lise', 'Üniversite', 'Yüksek Lisans / Doktora', 'Belirtmek İstemiyorum',
];

const GENDER_OPTIONS = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
  { value: 'other', label: 'Belirtmek İstemiyorum' },
];

const STEPS = ['Kişi Bilgileri', 'AI Analiz & Sorular', 'Hediye Önerileri'];

const INITIAL_FORM: RecipientForm = {
  name: '', birthDate: '', birthTime: '', gender: '', education: '',
  hobbies: [], occasion: '', giftDate: '', budgetMin: 100, budgetMax: 2000,
  relationship: '',
};

/* ───── Zodiac helpers ───── */
const ZODIAC_SIGNS = [
  { name: 'Koç', symbol: '♈', start: [3, 21], end: [4, 19] },
  { name: 'Boğa', symbol: '♉', start: [4, 20], end: [5, 20] },
  { name: 'İkizler', symbol: '♊', start: [5, 21], end: [6, 20] },
  { name: 'Yengeç', symbol: '♋', start: [6, 21], end: [7, 22] },
  { name: 'Aslan', symbol: '♌', start: [7, 23], end: [8, 22] },
  { name: 'Başak', symbol: '♍', start: [8, 23], end: [9, 22] },
  { name: 'Terazi', symbol: '♎', start: [9, 23], end: [10, 22] },
  { name: 'Akrep', symbol: '♏', start: [10, 23], end: [11, 21] },
  { name: 'Yay', symbol: '♐', start: [11, 22], end: [12, 21] },
  { name: 'Oğlak', symbol: '♑', start: [12, 22], end: [1, 19] },
  { name: 'Kova', symbol: '♒', start: [1, 20], end: [2, 18] },
  { name: 'Balık', symbol: '♓', start: [2, 19], end: [3, 20] },
];

// Approximate ascending sign based on birth time (simplified 2-hour rule)
const ASCENDANT_ORDER = ['Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak', 'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık'];

function getZodiacSign(dateStr: string): { name: string; symbol: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();

  for (const sign of ZODIAC_SIGNS) {
    const [sm, sd] = sign.start;
    const [em, ed] = sign.end;
    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) return sign;
    } else if (sm > em) {
      // Oğlak: Dec 22 - Jan 19
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return sign;
    } else {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return sign;
    }
  }
  return null;
}

function getAscendantSign(dateStr: string, timeStr: string): { name: string; symbol: string } | null {
  if (!dateStr || !timeStr) return null;
  const sunSign = getZodiacSign(dateStr);
  if (!sunSign) return null;

  const [hours] = timeStr.split(':').map(Number);
  const sunIdx = ASCENDANT_ORDER.indexOf(sunSign.name);
  // Approximate: sunrise sign = sun sign, then shifts ~1 sign per 2 hours
  // Sunrise assumed ~06:00
  const hoursFromSunrise = ((hours - 6) + 24) % 24;
  const signShift = Math.floor(hoursFromSunrise / 2);
  const ascIdx = (sunIdx + signShift) % 12;
  const ascName = ASCENDANT_ORDER[ascIdx];
  const ascSign = ZODIAC_SIGNS.find(z => z.name === ascName);
  return ascSign || null;
}

function calcAge(dateStr: string): number {
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/* ───── Saved Recipients helpers ───── */
function loadSavedRecipients(): SavedRecipient[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveRecipient(form: RecipientForm, giftHistory?: PastGift[]): void {
  const list = loadSavedRecipients();
  const idx = list.findIndex(r => r.form.name.toLowerCase() === form.name.toLowerCase());
  const entry: SavedRecipient = { id: crypto.randomUUID(), form, savedAt: Date.now(), giftHistory };
  if (idx >= 0) {
    // Preserve existing data if not provided
    entry.id = list[idx].id;
    entry.giftHistory = giftHistory || list[idx].giftHistory || [];
    entry.lastChat = list[idx].lastChat; // preserve lastChat
    list[idx] = entry;
  } else {
    list.unshift(entry);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
}

function addGiftToRecipient(recipientName: string, gift: PastGift): void {
  const list = loadSavedRecipients();
  const idx = list.findIndex(r => r.form.name.toLowerCase() === recipientName.toLowerCase());
  if (idx >= 0) {
    if (!list[idx].giftHistory) list[idx].giftHistory = [];
    list[idx].giftHistory!.unshift({ ...gift, id: crypto.randomUUID() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function removeGiftFromRecipient(recipientName: string, giftId: string): void {
  const list = loadSavedRecipients();
  const idx = list.findIndex(r => r.form.name.toLowerCase() === recipientName.toLowerCase());
  if (idx >= 0 && list[idx].giftHistory) {
    list[idx].giftHistory = list[idx].giftHistory!.filter(g => g.id !== giftId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

function saveChatToRecipient(recipientName: string, chatMessages: { role: 'user' | 'assistant'; content: string }[], aiInsights?: string): void {
  const list = loadSavedRecipients();
  const idx = list.findIndex(r => r.form.name.toLowerCase() === recipientName.toLowerCase());
  if (idx >= 0) {
    // Son 10 mesajı sakla (çok fazla veri olmasın)
    list[idx].lastChat = {
      messages: chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      aiInsights,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

function deleteSavedRecipient(id: string): void {
  const list = loadSavedRecipients().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ───── Speech Recognition ───── */
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function GiftPickerPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<RecipientForm>(INITIAL_FORM);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>(loadSavedRecipients());
  const [quickMode, setQuickMode] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<SavedRecipient | null>(null);
  const [hiddenProducts, setHiddenProducts] = useState<Set<string>>(new Set());
  const [reduceCount, setReduceCount] = useState(0);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [editAnchor, setEditAnchor] = useState<HTMLElement | null>(null);
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState<any>('');
  const [cartSnack, setCartSnack] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const micBtnRef = useRef<HTMLButtonElement>(null);
  const wavesContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const inputBeforeVoiceRef = useRef<string>('');

  // Restore state from sessionStorage (when returning from map)
  useEffect(() => {
    const saved = sessionStorage.getItem('giftPickerState');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.form) setForm(state.form);
        if (state.messages) setMessages(state.messages);
        if (state.activeStep !== undefined) setActiveStep(state.activeStep);
        if (state.quickMode !== undefined) setQuickMode(state.quickMode);
        if (state.selectedRecipient) setSelectedRecipient(state.selectedRecipient);
        if (state.hiddenProducts) setHiddenProducts(new Set(state.hiddenProducts));
      } catch { /* ignore */ }
      sessionStorage.removeItem('giftPickerState');
    }
  }, []);

  // Get user location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 5000 },
    );
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Cleanup speech recognition & audio
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      cancelAnimationFrame(animFrameRef.current);
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  /* ─── Voice volume analyser (GSAP animation) ─── */
  const startAudioAnalyser = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = Math.min(avg / 80, 1); // 0-1 arası normalise
        setVoiceVolume(normalized);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Mikrofon erişimi yoksa sessiz devam
    }
  };

  const stopAudioAnalyser = () => {
    cancelAnimationFrame(animFrameRef.current);
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setVoiceVolume(0);
  };

  // GSAP mic button animation driven by voiceVolume
  useEffect(() => {
    if (!micBtnRef.current) return;
    if (isListening) {
      const scale = 1 + voiceVolume * 0.5; // 1.0 → 1.5 arası
      const glowSize = 4 + voiceVolume * 20;
      const glowOpacity = 0.3 + voiceVolume * 0.5;
      gsap.to(micBtnRef.current, {
        scale,
        boxShadow: `0 0 ${glowSize}px ${glowSize / 2}px rgba(99,102,241,${glowOpacity})`,
        duration: 0.12,
        ease: 'power2.out',
        overwrite: true,
      });
    } else {
      gsap.to(micBtnRef.current, {
        scale: 1,
        boxShadow: '0 0 0 0 rgba(99,102,241,0)',
        duration: 0.3,
        ease: 'power2.out',
        overwrite: true,
      });
    }
  }, [voiceVolume, isListening]);

  // GSAP sound wave lines animation
  useEffect(() => {
    if (!wavesContainerRef.current) return;
    const container = wavesContainerRef.current;
    if (isListening && voiceVolume > 0.05) {
      const bars = container.querySelectorAll('.voice-wave-bar');
      bars.forEach((bar, i) => {
        const h = 8 + voiceVolume * 24 * (1 - Math.abs(i - 2) * 0.2);
        gsap.to(bar, {
          height: h,
          opacity: 0.6 + voiceVolume * 0.4,
          duration: 0.1,
          ease: 'power1.out',
          overwrite: true,
        });
      });
    } else if (!isListening) {
      const bars = container.querySelectorAll('.voice-wave-bar');
      bars.forEach((bar) => {
        gsap.to(bar, { height: 0, opacity: 0, duration: 0.3, overwrite: true });
      });
    }
  }, [voiceVolume, isListening]);

  /* ─── Speech-to-text ─── */
  const toggleListening = () => {
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      stopAudioAnalyser();
      return;
    }

    // Mevcut input'u kaydet — yeni ses metni buna eklenecek
    inputBeforeVoiceRef.current = input;

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      // Önceki metne ekle (arada boşluk)
      const prev = inputBeforeVoiceRef.current;
      setInput(prev ? prev.trimEnd() + ' ' + transcript : transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAudioAnalyser();
    };
    recognition.onerror = () => {
      setIsListening(false);
      stopAudioAnalyser();
    };

    recognitionRef.current = recognition;
    recognition.start();
    startAudioAnalyser();
    setIsListening(true);
  };

  /* ─── Form helpers ─── */
  const updateForm = (field: keyof RecipientForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleHobby = (hobby: string) => {
    setForm(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby],
    }));
  };

  const isFormValid = form.name.trim() && form.birthDate && form.gender && form.relationship && form.occasion;

  const zodiac = getZodiacSign(form.birthDate);
  const ascendant = getAscendantSign(form.birthDate, form.birthTime);
  const age = form.birthDate ? calcAge(form.birthDate) : 0;

  const saveStateAndNavigate = (url: string) => {
    sessionStorage.setItem('giftPickerState', JSON.stringify({
      form,
      messages,
      activeStep,
      quickMode,
      selectedRecipient,
      hiddenProducts: [...hiddenProducts],
    }));
    navigate(url);
  };

  const loadRecipient = (recipient: SavedRecipient) => {
    setForm({ ...recipient.form, occasion: '', giftDate: '', budgetMin: 100, budgetMax: 2000 });
    setSelectedRecipient(recipient);
    setQuickMode(true);
  };

  const handleDeleteRecipient = (id: string) => {
    deleteSavedRecipient(id);
    setSavedRecipients(loadSavedRecipients());
  };

  /* ─── Submit form �� Start AI chat ─── */
  const handleFormSubmit = async () => {
    // Save recipient for later
    saveRecipient(form);
    setSavedRecipients(loadSavedRecipients());

    // Quick mode: AI chat'i BYPASS et, doğrudan ürün ara
    if (quickMode) {
      return handleQuickSubmit();
    }

    setActiveStep(1);
    setLoading(true);

    const introText = buildFormSummary();

    try {
      const response = await apiClient.post('/products/gift-ai/chat', {
        messages: [{ role: 'user', content: introText }],
        context: buildContext(),
        formData: buildFormData(),
      });

      const data = response.data;

      const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: introText, timestamp: Date.now() };
      const aiMsg = {
        id: crypto.randomUUID(), role: 'assistant' as const, content: data.message,
        followUpQuestions: data.followUpQuestions, products: data.products,
        nearbyStores: data.nearbyStores, analysisComplete: data.analysisComplete,
        timestamp: Date.now(),
      };
      setMessages([userMsg, aiMsg]);

      // Analiz tamamlandıysa sohbeti kaydet
      if (data.analysisComplete && data.products?.length) {
        setActiveStep(2);
        saveChatToRecipient(form.name, [
          { role: 'user', content: introText },
          { role: 'assistant', content: data.message },
        ], data.message);
        setSavedRecipients(loadSavedRecipients());
      }
    } catch {
      setMessages([
        { id: crypto.randomUUID(), role: 'user', content: introText, timestamp: Date.now() },
        { id: crypto.randomUUID(), role: 'assistant', content: 'Bir hata oluştu. Lütfen tekrar deneyin.', timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Quick mode: doğrudan ürün önerisi (AI bypass) ─── */
  const handleQuickSubmit = async () => {
    setActiveStep(2);
    setLoading(true);

    const genderText = form.gender === 'male' ? 'erkek' : form.gender === 'female' ? 'kadın' : '';

    try {
      const response = await apiClient.post('/products/gift-suggestions', {
        age: age || undefined,
        gender: form.gender,
        interests: form.hobbies,
        occasion: form.occasion,
        budget: { min: form.budgetMin, max: form.budgetMax },
        relationship: form.relationship,
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
      });

      const raw = response.data?.data || response.data;
      // gift-suggestions returns { suggestions, grouped, nearbyStores, criteria }
      const products = raw.suggestions || Object.values(raw.grouped || {}).flat();

      let summaryText = `**${form.name}** için hızlı hediye önerileri!\n\n`;
      summaryText += `**Profil:** ${age || ''} yaşında${genderText ? ` ${genderText}` : ''}`;
      if (zodiac) summaryText += ` · ${zodiac.name}`;
      if (form.hobbies.length) summaryText += ` · ${form.hobbies.join(', ')}`;
      summaryText += `\n**Vesile:** ${form.occasion}`;
      summaryText += `\n**Bütçe:** ${form.budgetMin.toLocaleString('tr-TR')} – ${form.budgetMax.toLocaleString('tr-TR')} ₺`;

      // Kişilik analizi
      const traits: string[] = [];
      if (zodiac) {
        const zodiacTraits: Record<string, string> = {
          'Koç': 'enerjik, cesur ve lider ruhlu',
          'Boğa': 'kararlı, güvenilir ve estetik düşkünü',
          'İkizler': 'meraklı, sosyal ve çok yönlü',
          'Yengeç': 'duygusal, koruyucu ve sezgisel',
          'Aslan': 'karizmatik, yaratıcı ve kendine güvenen',
          'Başak': 'detaycı, analitik ve çalışkan',
          'Terazi': 'uyumlu, diplomatik ve adalet sever',
          'Akrep': 'tutkulu, kararlı ve derin düşünen',
          'Yay': 'maceracı, iyimser ve özgürlükçü',
          'Oğlak': 'disiplinli, azimli ve sorumluluk sahibi',
          'Kova': 'yenilikçi, bağımsız ve vizyoner',
          'Balık': 'hayalperest, empatik ve sanatsal ruhlu',
        };
        if (zodiacTraits[zodiac.name]) traits.push(zodiacTraits[zodiac.name]);
      }
      const hobbyPersonality: Record<string, string> = {
        'Teknoloji': 'yeniliklere açık',
        'Müzik': 'melodik ve duygusal bir ruha sahip',
        'Okuma': 'entelektüel ve meraklı',
        'Spor': 'dinamik ve rekabetçi',
        'Moda & Giyim': 'tarz sahibi ve trendleri takip eden',
        'Koleksiyon': 'tutkulu ve detay odaklı',
        'El İşi & DIY': 'yaratıcı ve sabırlı',
        'Dans': 'ritmik ve ifade gücü yüksek',
        'Yemek & Mutfak': 'keşifçi damak tadına sahip',
        'Seyahat': 'macera sever ve kültürel merak sahibi',
        'Fotoğrafçılık': 'gözlemci ve estetik bakış açısına sahip',
        'Oyun': 'stratejik düşünen ve eğlence sever',
        'Doğa & Bahçe': 'huzur arayan ve doğa dostu',
        'Sanat': 'yaratıcı ve ilham dolu',
        'Güzellik & Bakım': 'kendine özen gösteren',
        'Ev & Dekorasyon': 'estetik ve düzenli',
      };
      form.hobbies.forEach((h) => {
        if (hobbyPersonality[h] && traits.length < 4) traits.push(hobbyPersonality[h]);
      });
      if (age) {
        if (age <= 12) traits.push('keşfetmeyi seven ve enerjik');
        else if (age <= 18) traits.push('kendini keşfeden ve trendlere duyarlı');
        else if (age <= 30) traits.push('dinamik ve kariyer odaklı');
        else if (age <= 50) traits.push('deneyimli ve kaliteye önem veren');
        else traits.push('bilge ve konforunu önemseyen');
      }
      if (traits.length > 0) {
        summaryText += `\n\n🧠 **Kişilik Analizi:** ${form.name}, ${traits.join(', ')} bir kişilik profiline sahip. Bu özelliklere uygun hediyeler seçildi.`;
      }

      const aiMsg = {
        id: crypto.randomUUID(), role: 'assistant' as const,
        content: summaryText,
        products: products.map((p: any) => ({
          ...p,
          storeLatitude: p.store?.latitude || null,
          storeLongitude: p.store?.longitude || null,
        })),
        nearbyStores: raw.nearbyStores || [],
        analysisComplete: true,
        timestamp: Date.now(),
      };
      setMessages([aiMsg]);

      saveChatToRecipient(form.name, [
        { role: 'assistant', content: summaryText },
      ], summaryText);
      setSavedRecipients(loadSavedRecipients());
    } catch {
      setMessages([{
        id: crypto.randomUUID(), role: 'assistant' as const,
        content: 'Ürünler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const buildFormSummary = () => {
    if (quickMode && selectedRecipient?.lastChat) {
      // Hızlı mod: kişiyi zaten tanıyorsun, sadece yeni amaç ve bütçe
      const parts: string[] = [];
      parts.push(`${form.name} için yeniden hediye arıyorum. Bu kişiyi daha önce analiz etmiştin.`);
      parts.push(`Hatırlatma: ${form.relationship}, ${age} yaşında, ${GENDER_OPTIONS.find(g => g.value === form.gender)?.label}.`);
      if (zodiac) parts.push(`Burcu: ${zodiac.name}.`);
      if (form.hobbies.length) parts.push(`Hobileri: ${form.hobbies.join(', ')}.`);
      parts.push(`Bu sefer hediye vesilesi: ${form.occasion}.`);
      if (form.giftDate) parts.push(`Hediye tarihi: ${form.giftDate}.`);
      parts.push(`Bütçem: ${form.budgetMin} - ${form.budgetMax} TL.`);
      parts.push(`Önceki analizini ve geçmiş sohbetimizi dikkate alarak doğrudan hediye önerileri sun. Tekrar soru sormana gerek yok, zaten bu kişiyi tanıyorsun.`);
      return parts.join(' ');
    }

    const parts: string[] = [];
    parts.push(`${form.relationship} olan ${form.name} için hediye arıyorum.`);
    parts.push(`Doğum tarihi: ${new Date(form.birthDate).toLocaleDateString('tr-TR')}, Yaşı: ${age}.`);
    parts.push(`Cinsiyet: ${GENDER_OPTIONS.find(g => g.value === form.gender)?.label || form.gender}.`);
    if (zodiac) parts.push(`Burcu: ${zodiac.name}.`);
    if (ascendant) parts.push(`Yükselen burcu: ${ascendant.name}.`);
    if (form.education && form.education !== 'Belirtmek İstemiyorum') parts.push(`Eğitim: ${form.education}.`);
    if (form.hobbies.length) parts.push(`Hobileri: ${form.hobbies.join(', ')}.`);
    parts.push(`Hediye vesilesi: ${form.occasion}.`);
    if (form.giftDate) parts.push(`Hediye tarihi: ${form.giftDate}.`);
    parts.push(`Bütçem: ${form.budgetMin} - ${form.budgetMax} TL.`);
    return parts.join(' ');
  };

  const buildContext = () => ({
    recipientName: form.name,
    age: age || undefined,
    gender: form.gender,
    relationship: form.relationship,
    interests: form.hobbies,
    occasion: form.occasion,
    budget: { min: form.budgetMin, max: form.budgetMax },
    latitude: userLocation?.lat,
    longitude: userLocation?.lng,
  });

  const buildFormData = () => {
    // Find past gifts for this recipient from saved data
    const saved = savedRecipients.find(r => r.form.name.toLowerCase() === form.name.toLowerCase());
    const pastGifts = saved?.giftHistory?.map(g => ({
      productName: g.productName,
      occasion: g.occasion,
      giftDate: g.giftDate,
      reason: g.reason,
      rating: g.rating,
    }));

    // Son AI sohbetini de gönder (kişiyi tanıma bağlamı)
    const lastChat = saved?.lastChat;
    const lastConversation = lastChat?.messages?.length
      ? lastChat.messages.map(m => `${m.role === 'user' ? 'Kullanıcı' : 'AI'}: ${m.content}`).join('\n')
      : undefined;

    return {
      name: form.name,
      age,
      birthDate: form.birthDate,
      birthTime: form.birthTime || undefined,
      zodiacSign: zodiac?.name,
      ascendantSign: ascendant?.name,
      gender: form.gender,
      education: form.education,
      hobbies: form.hobbies,
      occasion: form.occasion,
      giftDate: form.giftDate,
      relationship: form.relationship,
      budget: { min: form.budgetMin, max: form.budgetMax },
      pastGifts: pastGifts?.length ? pastGifts : undefined,
      quickMode: quickMode || undefined,
      lastConversation: quickMode ? lastConversation : undefined,
      aiInsights: quickMode ? lastChat?.aiInsights : undefined,
    };
  };

  /* ─── Chat ─── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    // Stop listening if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: text.trim(), timestamp: Date.now(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await apiClient.post('/products/gift-ai/chat', {
        messages: apiMessages,
        context: buildContext(),
        formData: buildFormData(),
      });

      const data = response.data;
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', content: data.message,
        products: data.products, nearbyStores: data.nearbyStores,
        followUpQuestions: data.followUpQuestions, analysisComplete: data.analysisComplete,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);

      if (data.analysisComplete && data.products?.length) {
        setActiveStep(2);
        // Sohbeti kaydet
        const allMsgs = [...newMessages, aiMsg];
        saveChatToRecipient(form.name, allMsgs.map(m => ({ role: m.role, content: m.content })), data.message);
        setSavedRecipients(loadSavedRecipients());
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: 'Bir hata oluştu. Lütfen tekrar deneyin.', timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, form, userLocation, isListening, quickMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleAddToCart = (product: any) => {
    dispatch(addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: Number(product.salePrice || product.price),
      thumbnail: product.thumbnail || product.images?.[0] || '',
      quantity: 1,
      storeId: product.storeId || product.store?.id || '',
    }));
    setCartSnack(true);

    // Record this gift in recipient's history
    if (form.name) {
      addGiftToRecipient(form.name, {
        productName: product.name,
        productThumbnail: product.thumbnail || product.images?.[0] || '',
        price: Number(product.salePrice || product.price),
        occasion: form.occasion,
        giftDate: form.giftDate || new Date().toISOString().split('T')[0],
        reason: `${form.occasion} için hediye olarak seçildi`,
      });
      setSavedRecipients(loadSavedRecipients());
    }
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setActiveStep(0);
      setMessages([]);
      setInput('');
    } else if (activeStep === 2) {
      setActiveStep(1);
    }
  };

  const handleStepClick = (stepIdx: number) => {
    if (stepIdx < activeStep) {
      if (stepIdx === 0) {
        setActiveStep(0);
        setMessages([]);
        setInput('');
      } else if (stepIdx === 1 && activeStep === 2) {
        setActiveStep(1);
      }
    }
  };

  const openEditPopover = (e: React.MouseEvent<HTMLElement>, field: string) => {
    setEditAnchor(e.currentTarget);
    setEditField(field);
    if (field === 'name') setEditValue(form.name);
    else if (field === 'gender') setEditValue(form.gender);
    else if (field === 'relationship') setEditValue(form.relationship);
    else if (field === 'occasion') setEditValue(form.occasion);
    else if (field === 'budget') setEditValue([form.budgetMin, form.budgetMax]);
    else if (field === 'hobbies') setEditValue([...form.hobbies]);
    else if (field === 'birthDate') setEditValue(form.birthDate);
  };

  const closeEditPopover = () => {
    setEditAnchor(null);
    setEditField('');
  };

  const applyEdit = (directValue?: any) => {
    const val = directValue !== undefined ? directValue : editValue;
    if (editField === 'name') setForm(f => ({ ...f, name: val }));
    else if (editField === 'gender') setForm(f => ({ ...f, gender: val }));
    else if (editField === 'relationship') setForm(f => ({ ...f, relationship: val }));
    else if (editField === 'occasion') setForm(f => ({ ...f, occasion: val }));
    else if (editField === 'budget') setForm(f => ({ ...f, budgetMin: val[0], budgetMax: val[1] }));
    else if (editField === 'hobbies') setForm(f => ({ ...f, hobbies: val }));
    else if (editField === 'birthDate') setForm(f => ({ ...f, birthDate: val }));
    closeEditPopover();
  };

  const resetAll = () => {
    setActiveStep(0);
    setForm(INITIAL_FORM);
    setMessages([]);
    setInput('');
    setHiddenProducts(new Set());
    setReduceCount(0);
    setQuickMode(false);
    setSelectedRecipient(null);
  };

  const calcDistance = (storeLat?: number, storeLng?: number): string | null => {
    if (!userLocation || !storeLat || !storeLng) return null;
    const R = 6371;
    const dLat = (storeLat - userLocation.lat) * Math.PI / 180;
    const dLng = (storeLng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(storeLat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
  };

  // Get the current AI question (last assistant message's content — the question part)
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
  const currentQuestion = lastAssistantMsg?.followUpQuestions?.[0];
  const isLastMsgAssistant = messages.length > 0 && messages[messages.length - 1].role === 'assistant';

  /* ═══════════════════════════════════════ RENDER ═══════════════════════════════════════ */
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
            <SmartToyIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Typography variant="h5" fontWeight={800}>AI Hediye Danışmanı</Typography>
          {activeStep > 0 && (
            <IconButton size="small" onClick={resetAll} title="Baştan Başla" sx={{ ml: 1 }}>
              <RestartAltIcon />
            </IconButton>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Kişiye özel analiz ile en uygun hediyeyi bulun
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label, idx) => (
          <Step
            key={label}
            completed={idx < activeStep}
            sx={idx < activeStep ? { cursor: 'pointer', '& .MuiStepLabel-root': { cursor: 'pointer' } } : {}}
            onClick={() => handleStepClick(idx)}
          >
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ═══ STEP 0: Registration Form ═══ */}
      {activeStep === 0 && (
        <Fade in>
          <Box>
            {/* ─── Saved Recipients Cards ─── */}
            {savedRecipients.length > 0 && (
              <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 3, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <HistoryIcon color="secondary" />
                  <Typography variant="subtitle1" fontWeight={700}>Kayıtlı Kişiler</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    Hızlıca hediye aramak için bir kişi seçin
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
                  {savedRecipients.filter(r => r.form).map((recipient) => {
                    const rZodiac = getZodiacSign(recipient.form.birthDate);
                    const rAge = recipient.form.birthDate ? calcAge(recipient.form.birthDate) : 0;
                    const hasHistory = recipient.giftHistory && recipient.giftHistory.length > 0;
                    return (
                      <Paper
                        key={recipient.id}
                        elevation={0}
                        onClick={() => loadRecipient(recipient)}
                        sx={{
                          p: 2, minWidth: hasHistory ? 260 : 160, maxWidth: 320, cursor: 'pointer',
                          border: '1px solid', borderColor: 'divider',
                          borderRadius: 2, flexShrink: 0, position: 'relative',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: 'secondary.main', boxShadow: 2, transform: 'translateY(-2px)' },
                        }}
                      >
                        <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.3 }}>
                          <Tooltip title="Testi Yeniden Yap">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setForm({ ...recipient.form, occasion: '', giftDate: '', budgetMin: 100, budgetMax: 2000 });
                                setSelectedRecipient(null);
                                setQuickMode(false);
                              }}
                              sx={{ color: 'grey.400', '&:hover': { color: 'primary.main' }, p: 0.5 }}
                            >
                              <RestartAltIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleDeleteRecipient(recipient.id); }}
                            sx={{ color: 'grey.400', '&:hover': { color: 'error.main' }, p: 0.5 }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>

                        {/* Kişi bilgileri — üst kısım */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: hasHistory ? 1.5 : 0 }}>
                          <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40, flexShrink: 0 }}>
                            <PersonIcon />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap>{recipient.form.name}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {rAge > 0 && `${rAge} yaş`}{rZodiac ? ` · ${rZodiac.symbol} ${rZodiac.name}` : ''}
                              {recipient.form.relationship ? ` · ${recipient.form.relationship}` : ''}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Hediye geçmişi — alt kısım */}
                        {hasHistory && (
                          <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', pt: 1 }}>
                            <Typography variant="caption" color="secondary.main" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                              Alınan Hediyeler ({recipient.giftHistory!.length})
                            </Typography>
                            <Box sx={{ maxHeight: 220, overflowY: 'auto', pr: 0.5 }}>
                            {recipient.giftHistory!.map((g) => (
                              <Box
                                key={g.id}
                                sx={{
                                  display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.8, p: 0.8,
                                  bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.200',
                                }}
                              >
                                {/* Ürün görseli (küçük thumbnail) */}
                                {g.productThumbnail && (
                                  <Box
                                    component="img"
                                    src={g.productThumbnail}
                                    alt={g.productName}
                                    sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                                  />
                                )}
                                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                  <Typography variant="caption" fontWeight={600} display="block" noWrap sx={{ fontSize: 11 }}>
                                    {g.productName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 10 }}>
                                    {g.occasion} · {g.giftDate}
                                  </Typography>
                                  {g.reason && (
                                    <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ fontSize: 10, fontStyle: 'italic' }}>
                                      {g.reason}
                                    </Typography>
                                  )}
                                  {g.price && (
                                    <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ fontSize: 10 }}>
                                      {Number(g.price).toLocaleString('tr-TR')} ₺
                                    </Typography>
                                  )}
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (g.id) {
                                      removeGiftFromRecipient(recipient.form.name, g.id);
                                      setSavedRecipients(loadSavedRecipients());
                                    }
                                  }}
                                  sx={{ p: 0, mt: 0.3, color: 'grey.400', '&:hover': { color: 'error.main' }, flexShrink: 0 }}
                                >
                                  <CloseIcon sx={{ fontSize: 12 }} />
                                </IconButton>
                              </Box>
                            ))}
                            </Box>
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              </Paper>
            )}

          {/* ─── Quick Mode: Kayıtlı kişi için hızlı form ─── */}
          {quickMode && selectedRecipient && (
            <Paper elevation={2} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 44, height: 44 }}>
                  <PersonIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={700}>{form.name} için Hızlı Hediye</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {age > 0 && `${age} yaş`}{zodiac ? ` · ${zodiac.symbol} ${zodiac.name}` : ''}{form.relationship ? ` · ${form.relationship}` : ''}
                    {form.hobbies.length > 0 ? ` · ${form.hobbies.join(', ')}` : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button size="small" variant="text" startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />} onClick={() => { setQuickMode(false); setSelectedRecipient(null); }}>
                    Testi Yeniden Yap
                  </Button>
                </Box>
              </Box>

              {/* Son AI yorumları */}
              {selectedRecipient.lastChat && (
                <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'secondary.50', borderRadius: 2, border: '1px solid', borderColor: 'secondary.200' }}>
                  <Typography variant="caption" fontWeight={700} color="secondary.main" display="block" mb={0.5}>
                    Son AI Analizi ({new Date(selectedRecipient.lastChat.savedAt).toLocaleDateString('tr-TR')})
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, whiteSpace: 'pre-line', maxHeight: 120, overflow: 'auto' }}>
                    {selectedRecipient.lastChat.aiInsights?.substring(0, 500) || selectedRecipient.lastChat.messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content?.substring(0, 500)}
                    {((selectedRecipient.lastChat.aiInsights?.length || 0) > 500 || (selectedRecipient.lastChat.messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content?.length || 0) > 500) ? '...' : ''}
                  </Typography>
                </Paper>
              )}

              {/* Hediye geçmişi özet */}
              {selectedRecipient.giftHistory && selectedRecipient.giftHistory.length > 0 && (
                <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
                    Daha önce alınan hediyeler ({selectedRecipient.giftHistory.length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedRecipient.giftHistory.slice(0, 5).map((g) => (
                      <Chip key={g.id} size="small" label={`${g.productName} (${g.occasion})`} variant="outlined" />
                    ))}
                  </Box>
                </Paper>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Hediye Vesilesi *</InputLabel>
                    <Select value={form.occasion} label="Hediye Vesilesi *" onChange={e => updateForm('occasion', e.target.value)}>
                      {OCCASION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Hediye Tarihi" type="date"
                    value={form.giftDate} onChange={e => updateForm('giftDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Bütçe: {form.budgetMin.toLocaleString('tr-TR')} ₺ – {form.budgetMax.toLocaleString('tr-TR')} ₺
                  </Typography>
                  <Slider
                    value={[form.budgetMin, form.budgetMax]}
                    onChange={(_, v) => {
                      const [min, max] = v as number[];
                      setForm(prev => ({ ...prev, budgetMin: min, budgetMax: max }));
                    }}
                    min={50} max={50000} step={50}
                    valueLabelDisplay="auto"
                    valueLabelFormat={v => `${v.toLocaleString('tr-TR')} ₺`}
                    sx={{ color: 'secondary.main' }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained" size="large" endIcon={<ArrowForwardIcon />}
                  onClick={handleFormSubmit} disabled={!form.occasion}
                  sx={{
                    px: 5, py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 16,
                    bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' },
                  }}
                >
                  Hızlı Öneri Al
                </Button>
                {!form.occasion && (
                  <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                    * Hediye vesilesi seçin
                  </Typography>
                )}
              </Box>
            </Paper>
          )}

          {/* ─── Full Form (normal mode veya quickMode kapalı) ─── */}
          {!quickMode && (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <CardGiftcardIcon color="secondary" />
              <Typography variant="h6" fontWeight={700}>
                {form.name ? `${form.name} için Hediye` : 'Hediye Alacağınız Kişi'}
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {/* Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Adı" placeholder="Örn: Ayşe"
                  value={form.name} onChange={e => updateForm('name', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment> }}
                />
              </Grid>
              {/* Birth Date */}
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth label="Doğum Tarihi" type="date"
                  value={form.birthDate} onChange={e => updateForm('birthDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CakeIcon fontSize="small" /></InputAdornment> }}
                />
              </Grid>
              {/* Birth Time (optional) */}
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth label="Doğum Saati" type="time" placeholder="Örn: 14:30"
                  value={form.birthTime} onChange={e => updateForm('birthTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Opsiyonel (yükselen burç için)"
                />
              </Grid>
              {/* Zodiac display */}
              {zodiac && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`${zodiac.symbol} ${zodiac.name} burcu`}
                      color="secondary" variant="filled"
                      sx={{ fontWeight: 700, fontSize: 14 }}
                    />
                    {ascendant && (
                      <Chip
                        label={`Yükselen: ${ascendant.symbol} ${ascendant.name}`}
                        color="primary" variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    {age > 0 && (
                      <Chip label={`${age} yaşında`} variant="outlined" />
                    )}
                  </Box>
                </Grid>
              )}
              {/* Gender */}
              <Grid item xs={6} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Cinsiyet</InputLabel>
                  <Select value={form.gender} label="Cinsiyet" onChange={e => updateForm('gender', e.target.value)}>
                    {GENDER_OPTIONS.map(g => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {/* Relationship */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Yakınlık</InputLabel>
                  <Select value={form.relationship} label="Yakınlık" onChange={e => updateForm('relationship', e.target.value)}
                    startAdornment={<InputAdornment position="start"><FavoriteIcon fontSize="small" /></InputAdornment>}
                  >
                    {RELATIONSHIP_OPTIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {/* Education */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Eğitim Durumu</InputLabel>
                  <Select value={form.education} label="Eğitim Durumu" onChange={e => updateForm('education', e.target.value)}
                    startAdornment={<InputAdornment position="start"><SchoolIcon fontSize="small" /></InputAdornment>}
                  >
                    {EDUCATION_OPTIONS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {/* Occasion */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Hediye Vesilesi</InputLabel>
                  <Select value={form.occasion} label="Hediye Vesilesi" onChange={e => updateForm('occasion', e.target.value)}>
                    {OCCASION_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {/* Gift Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Hediye Tarihi" type="date"
                  value={form.giftDate} onChange={e => updateForm('giftDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {/* Budget Range */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
                  Bütçe Aralığı: {form.budgetMin.toLocaleString('tr-TR')} ₺ – {form.budgetMax.toLocaleString('tr-TR')} ₺
                </Typography>
                <Slider
                  value={[form.budgetMin, form.budgetMax]}
                  onChange={(_, v) => {
                    const [min, max] = v as number[];
                    setForm(prev => ({ ...prev, budgetMin: min, budgetMax: max }));
                  }}
                  min={50} max={50000} step={50}
                  valueLabelDisplay="auto"
                  valueLabelFormat={v => `${v.toLocaleString('tr-TR')} ₺`}
                  sx={{ color: 'secondary.main' }}
                />
              </Grid>
              {/* Hobbies */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
                  Hobileri & İlgi Alanları
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {HOBBY_OPTIONS.map(hobby => (
                    <Chip
                      key={hobby} label={hobby}
                      onClick={() => toggleHobby(hobby)}
                      color={form.hobbies.includes(hobby) ? 'secondary' : 'default'}
                      variant={form.hobbies.includes(hobby) ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer', fontWeight: form.hobbies.includes(hobby) ? 600 : 400 }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>

            {/* Submit */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained" size="large" endIcon={<ArrowForwardIcon />}
                onClick={handleFormSubmit} disabled={!isFormValid}
                sx={{
                  px: 5, py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 16,
                  bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' },
                }}
              >
                AI Danışmanı Başlat
              </Button>
              {!isFormValid && (
                <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                  * Ad, doğum tarihi, cinsiyet, yakınlık ve vesile alanları zorunludur
                </Typography>
              )}
            </Box>
          </Paper>
          )}
          </Box>
        </Fade>
      )}

      {/* ═══ STEP 1 & 2: AI Chat ═══ */}
      {activeStep >= 1 && (
        <Fade in>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
            {/* Recipient summary card */}
            <Paper elevation={0} sx={{ px: 2, py: 1.5, mb: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Tooltip title="Bilgileri Düzenle">
                  <IconButton
                    size="small"
                    onClick={handleBack}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      width: 32,
                      height: 32,
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <ArrowBackIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Chip size="small" icon={<PersonIcon />} label={form.name} color="primary" onClick={e => openEditPopover(e, 'name')} onDelete={e => openEditPopover(e, 'name')} deleteIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ cursor: 'pointer' }} />
                {age > 0 && <Chip size="small" label={`${age} yaş`} variant="outlined" onClick={e => openEditPopover(e, 'birthDate')} onDelete={e => openEditPopover(e, 'birthDate')} deleteIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ cursor: 'pointer' }} />}
                {zodiac && <Chip size="small" label={`${zodiac.symbol} ${zodiac.name}`} color="secondary" />}
                {ascendant && <Chip size="small" label={`Yük: ${ascendant.symbol} ${ascendant.name}`} variant="outlined" />}
                <Chip size="small" label={GENDER_OPTIONS.find(g => g.value === form.gender)?.label} variant="outlined" onClick={e => openEditPopover(e, 'gender')} onDelete={e => openEditPopover(e, 'gender')} deleteIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ cursor: 'pointer' }} />
                <Chip size="small" icon={<FavoriteIcon />} label={form.relationship} variant="outlined" onClick={e => openEditPopover(e, 'relationship')} onDelete={e => openEditPopover(e, 'relationship')} deleteIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ cursor: 'pointer' }} />
                <Chip size="small" icon={<CardGiftcardIcon />} label={form.occasion} color="secondary" variant="outlined" onClick={e => openEditPopover(e, 'occasion')} onDelete={e => openEditPopover(e, 'occasion')} deleteIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ cursor: 'pointer' }} />
                <Chip size="small" label={`${form.budgetMin.toLocaleString('tr-TR')}–${form.budgetMax.toLocaleString('tr-TR')} ₺`} variant="outlined" onClick={e => openEditPopover(e, 'budget')} onDelete={e => openEditPopover(e, 'budget')} deleteIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ cursor: 'pointer' }} />
                {form.hobbies.length > 0 && (
                  <Chip size="small" label={form.hobbies.join(', ')} variant="outlined" onClick={e => openEditPopover(e, 'hobbies')} onDelete={e => openEditPopover(e, 'hobbies')} deleteIcon={<EditIcon sx={{ fontSize: 14 }} />} sx={{ cursor: 'pointer' }} />
                )}
              </Box>
            </Paper>

            {/* Edit Popover */}
            <Popover
              open={Boolean(editAnchor)}
              anchorEl={editAnchor}
              onClose={closeEditPopover}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{ paper: { sx: { p: 2, borderRadius: 2, minWidth: 220, maxWidth: 320 } } }}
            >
              {editField === 'name' && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField size="small" label="İsim" value={editValue} onChange={e => setEditValue(e.target.value)} fullWidth autoFocus />
                  <IconButton size="small" color="primary" onClick={applyEdit}><CheckIcon /></IconButton>
                </Box>
              )}
              {editField === 'birthDate' && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField size="small" type="date" label="Doğum Tarihi" value={editValue} onChange={e => setEditValue(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} autoFocus />
                  <IconButton size="small" color="primary" onClick={applyEdit}><CheckIcon /></IconButton>
                </Box>
              )}
              {editField === 'gender' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Cinsiyet</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {GENDER_OPTIONS.map(g => (
                      <Chip
                        key={g.value}
                        label={g.label}
                        size="small"
                        color={editValue === g.value ? 'primary' : 'default'}
                        variant={editValue === g.value ? 'filled' : 'outlined'}
                        onClick={() => applyEdit(g.value)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {editField === 'relationship' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>İlişki</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {RELATIONSHIP_OPTIONS.map(r => (
                      <Chip
                        key={r}
                        label={r}
                        size="small"
                        color={editValue === r ? 'primary' : 'default'}
                        variant={editValue === r ? 'filled' : 'outlined'}
                        onClick={() => applyEdit(r)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {editField === 'occasion' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Vesile</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {OCCASION_OPTIONS.map(o => (
                      <Chip
                        key={o}
                        label={o}
                        size="small"
                        color={editValue === o ? 'primary' : 'default'}
                        variant={editValue === o ? 'filled' : 'outlined'}
                        onClick={() => applyEdit(o)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {editField === 'budget' && (
                <Box sx={{ px: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Bütçe Aralığı</Typography>
                  <Slider
                    value={editValue}
                    onChange={(_, v) => setEditValue(v as number[])}
                    min={0}
                    max={50000}
                    step={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v: number) => `${v.toLocaleString('tr-TR')} ₺`}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption">{editValue[0]?.toLocaleString('tr-TR')} ₺</Typography>
                    <Typography variant="caption">{editValue[1]?.toLocaleString('tr-TR')} ₺</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', mt: 1 }}>
                    <Button size="small" variant="contained" onClick={applyEdit}>Uygula</Button>
                  </Box>
                </Box>
              )}
              {editField === 'hobbies' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>İlgi Alanları</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {HOBBY_OPTIONS.map(h => (
                      <Chip
                        key={h}
                        label={h}
                        size="small"
                        color={editValue.includes(h) ? 'primary' : 'default'}
                        variant={editValue.includes(h) ? 'filled' : 'outlined'}
                        onClick={() => setEditValue((prev: string[]) => prev.includes(h) ? prev.filter((x: string) => x !== h) : [...prev, h])}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Button size="small" variant="contained" onClick={applyEdit}>Uygula</Button>
                  </Box>
                </Box>
              )}
            </Popover>

            {/* Chat messages */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, px: 0.5, maxHeight: 'calc(100vh - 460px)' }}>
              {messages.map((msg, msgIdx) => {
                // Only show the first user message as a compact summary (not the form text)
                const isFirstUserMsg = msg.role === 'user' && msgIdx === 0;

                return (
                  <Box key={msg.id} sx={{ mb: 2.5 }}>
                    {/* Message bubble */}
                    <Box sx={{
                      display: 'flex', gap: 1.5, alignItems: 'flex-start',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    }}>
                      <Avatar
                        sx={{
                          width: 32, height: 32, flexShrink: 0, mt: 0.5,
                          bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                        }}
                      >
                        {msg.role === 'user' ? <PersonIcon sx={{ fontSize: 18 }} /> : <SmartToyIcon sx={{ fontSize: 18 }} />}
                      </Avatar>
                      <Paper
                        elevation={0}
                        sx={{
                          px: 2, py: 1.5, maxWidth: '80%',
                          bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                          color: msg.role === 'user' ? 'white' : 'text.primary',
                          borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        }}
                      >
                        {isFirstUserMsg ? (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                            {form.name} için hediye arıyorum
                          </Typography>
                        ) : msg.role === 'assistant' ? (
                          <Typography
                            variant="body2"
                            sx={{ whiteSpace: 'pre-line', lineHeight: 1.7, '& strong': { fontWeight: 700 }, '& em': { fontStyle: 'italic' } }}
                            dangerouslySetInnerHTML={{
                              __html: msg.content
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/•/g, '&bull;'),
                            }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                            {msg.content}
                          </Typography>
                        )}
                      </Paper>
                    </Box>

                    {/* ─── Product results with distance ─── */}
                    {msg.products && msg.products.length > 0 && (() => {
                      // Filter hidden + apply reduce logic
                      const allVisible = msg.products.filter((p: any) => !hiddenProducts.has(p.id));
                      // Sort by matchScore descending so lowest-scored get cut first
                      const sorted = [...allVisible].sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));
                      let maxShow = sorted.length;
                      for (let r = 0; r < reduceCount; r++) {
                        maxShow = Math.max(1, Math.ceil(maxShow / 2));
                      }
                      const visibleProducts = sorted.slice(0, maxShow);

                      return (
                      <Box sx={{ mt: 2, ml: { xs: 0, sm: 5.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <CardGiftcardIcon color="secondary" fontSize="small" />
                          <Typography variant="subtitle2" fontWeight={700}>
                            {form.name} için {visibleProducts.length} hediye önerisi
                          </Typography>
                        </Box>
                        <Grid container spacing={1.5}>
                          {visibleProducts.map((product: any) => {
                            const hasDiscount = product.salePrice && Number(product.salePrice) < Number(product.price);
                            const distance = calcDistance(
                              product.store?.latitude || product.storeLatitude,
                              product.store?.longitude || product.storeLongitude,
                            );
                            const storeName = product.store?.name || '';
                            return (
                              <Grid item xs={6} sm={4} md={3} key={product.id}>
                                <Card sx={{
                                  height: '100%', display: 'flex', flexDirection: 'column',
                                  transition: 'all 0.2s', position: 'relative',
                                  '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                                  '&:hover .remove-btn': { opacity: 1 },
                                }}>
                                  {/* Remove (X) button */}
                                  <IconButton
                                    className="remove-btn"
                                    size="small"
                                    onClick={() => setHiddenProducts(prev => new Set(prev).add(product.id))}
                                    sx={{
                                      position: 'absolute', top: 4, right: 4, zIndex: 2,
                                      bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
                                      width: 24, height: 24, opacity: { xs: 1, sm: 0 },
                                      transition: 'opacity 0.2s',
                                      '&:hover': { bgcolor: 'error.main' },
                                    }}
                                  >
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                  </IconButton>

                                  {/* Product image with store name overlay */}
                                  <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                                    <CardMedia
                                      component="img"
                                      image={product.thumbnail || product.images?.[0] || 'https://via.placeholder.com/200'}
                                      alt={product.name}
                                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                      onClick={() => saveStateAndNavigate(`/product/${product.slug}?from=gift`)}
                                    />
                                    {storeName && (
                                      <Box sx={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.4,
                                        display: 'flex', alignItems: 'center', gap: 0.4,
                                      }}>
                                        <StoreIcon sx={{ fontSize: 11, color: 'white' }} />
                                        <Typography variant="caption" sx={{ color: 'white', fontSize: 10, fontWeight: 500 }} noWrap>
                                          {storeName}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>

                                  <CardContent sx={{ flexGrow: 1, p: 1.5, pb: 0.5 }}>
                                    <Typography
                                      variant="caption" fontWeight={600} noWrap
                                      sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                                      onClick={() => saveStateAndNavigate(`/product/${product.slug}?from=gift`)}
                                    >
                                      {product.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, my: 0.3 }}>
                                      <Rating value={product.ratingAverage || 0} size="small" readOnly precision={0.5} sx={{ fontSize: 12 }} />
                                      <Typography variant="caption" color="text.secondary" fontSize={10}>
                                        ({product.ratingCount || 0})
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                      <Typography variant="body2" fontWeight={700} color={hasDiscount ? 'error.main' : 'text.primary'}>
                                        {Number(hasDiscount ? product.salePrice : product.price).toLocaleString('tr-TR')} ₺
                                      </Typography>
                                      {hasDiscount && (
                                        <Typography variant="caption" sx={{ textDecoration: 'line-through' }} color="text.secondary">
                                          {Number(product.price).toLocaleString('tr-TR')} ₺
                                        </Typography>
                                      )}
                                    </Box>
                                    {distance && (
                                      <Typography
                                        variant="caption" fontWeight={600}
                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.3, color: 'secondary.dark' }}
                                      >
                                        <LocationOnIcon sx={{ fontSize: 12 }} />
                                        {distance} uzaklıkta
                                      </Typography>
                                    )}
                                  </CardContent>
                                  <CardActions sx={{ px: 1.5, pb: 1, pt: 0, gap: 0.5 }}>
                                    <Button
                                      size="small" variant="contained"
                                      startIcon={<ShoppingCartIcon sx={{ fontSize: 14 }} />}
                                      onClick={() => handleAddToCart(product)}
                                      sx={{ fontSize: 11, py: 0.3, flexGrow: 1 }}
                                    >
                                      Sepete Ekle
                                    </Button>
                                    {(product.store?.latitude || product.storeLatitude) && (
                                      <IconButton
                                        size="small" color="primary"
                                        onClick={() => saveStateAndNavigate(`/map?lat=${product.store?.latitude || product.storeLatitude}&lng=${product.store?.longitude || product.storeLongitude}&name=${encodeURIComponent(product.store?.name || '')}&storeId=${product.store?.id || product.storeId || ''}&productId=${product.id}&from=gift`)}
                                      >
                                        <MapIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    )}
                                  </CardActions>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>

                        {/* "Benim için önerileri azalt" button */}
                        {visibleProducts.length > 1 && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              startIcon={<FilterListIcon />}
                              onClick={() => setReduceCount(prev => prev + 1)}
                              sx={{ textTransform: 'none', borderRadius: 3, px: 3 }}
                            >
                              Benim için önerileri azalt ({visibleProducts.length} → {Math.max(1, Math.ceil(visibleProducts.length / 2))})
                            </Button>
                          </Box>
                        )}
                      </Box>
                      );
                    })()}
                  </Box>
                );
              })}

              {/* Loading */}
              {loading && (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', mt: 0.5 }}>
                    <SmartToyIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Paper elevation={0} sx={{ px: 2.5, py: 2, bgcolor: 'grey.100', borderRadius: '16px 16px 16px 4px' }}>
                    <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                      <CircularProgress size={14} color="secondary" />
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        {form.name} için analiz yapıyorum...
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}

              <div ref={chatEndRef} />
            </Box>

            {/* ─── Current Question Card (shown above input) ─── */}
            {isLastMsgAssistant && currentQuestion && !loading && (
              <Paper
                elevation={0}
                sx={{
                  px: 2.5, py: 1.5, mb: 1.5, bgcolor: 'secondary.50',
                  border: '1px solid', borderColor: 'secondary.200',
                  borderRadius: 2,
                }}
              >
                <Typography variant="caption" color="secondary.dark" fontWeight={700} sx={{ mb: 0.5, display: 'block' }}>
                  Danışmanın sorusu:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {currentQuestion}
                </Typography>
              </Paper>
            )}

            {/* Input area with mic button */}
            <Paper
              elevation={3}
              sx={{
                display: 'flex', alignItems: 'flex-end', gap: 1, p: 1.5,
                borderRadius: 3, border: '1px solid',
                borderColor: isListening ? 'primary.main' : 'divider',
                transition: 'border-color 0.3s',
              }}
            >
              {/* Mic button with GSAP voice-reactive animation */}
              {SpeechRecognition && (
                <Tooltip title={isListening ? 'Dinlemeyi durdur' : 'Sesle yanıtla'}>
                  <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    {/* Sound wave bars — left side */}
                    <Box
                      ref={wavesContainerRef}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: '2px',
                        position: 'absolute', right: '100%', mr: 0.5,
                        flexDirection: 'row-reverse',
                      }}
                    >
                      {[0, 1, 2, 3, 4].map(i => (
                        <Box
                          key={i}
                          className="voice-wave-bar"
                          sx={{
                            width: 3, height: 0, borderRadius: 2,
                            bgcolor: 'primary.main', opacity: 0,
                            transition: 'none',
                          }}
                        />
                      ))}
                    </Box>

                    <IconButton
                      ref={micBtnRef}
                      onClick={toggleListening}
                      disabled={loading}
                      sx={{
                        width: 40, height: 40,
                        bgcolor: isListening
                          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                          : 'grey.100',
                        background: isListening
                          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                          : undefined,
                        color: isListening ? 'white' : 'grey.600',
                        '&:hover': {
                          bgcolor: isListening ? '#4f46e5' : 'grey.200',
                          background: isListening
                            ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                            : undefined,
                        },
                      }}
                    >
                      {isListening ? <MicOffIcon sx={{ fontSize: 20 }} /> : <MicIcon sx={{ fontSize: 20 }} />}
                    </IconButton>

                    {/* Sound wave bars — right side */}
                    <Box
                      sx={{
                        display: 'flex', alignItems: 'center', gap: '2px',
                        position: 'absolute', left: '100%', ml: 0.5,
                      }}
                    >
                      {[0, 1, 2, 3, 4].map(i => (
                        <Box
                          key={`r-${i}`}
                          className="voice-wave-bar"
                          sx={{
                            width: 3, height: 0, borderRadius: 2,
                            bgcolor: 'primary.main', opacity: 0,
                            transition: 'none',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Tooltip>
              )}

              <TextField
                fullWidth multiline maxRows={4}
                placeholder={isListening ? 'Dinleniyor... konuşmaya başlayın' : 'Cevabınızı yazın veya mikrofona basıp konuşun...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{ '& .MuiInputBase-root': { fontSize: 14 } }}
                disabled={loading}
                autoFocus
              />

              <IconButton
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                color="primary"
                sx={{
                  bgcolor: input.trim() ? 'primary.main' : 'grey.200',
                  color: input.trim() ? 'white' : 'grey.500',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'grey.200', color: 'grey.400' },
                  width: 40, height: 40,
                }}
              >
                <SendIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Paper>

            <Typography variant="caption" color="text.disabled" textAlign="center" sx={{ mt: 1 }}>
              Powered by Claude AI · VeniVidiCoop
            </Typography>
          </Box>
        </Fade>
      )}

      {/* Dialog removed — saved recipients now shown inline */}

      <Snackbar open={cartSnack} autoHideDuration={2500} onClose={() => setCartSnack(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setCartSnack(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          Ürün sepete eklendi!
        </Alert>
      </Snackbar>
    </Container>
  );
}
