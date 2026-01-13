import React, { useState, useRef, useEffect } from 'react';
import { PromoRequest, ContentType, Language } from '../types';
import { Sparkles, ArrowRight, Video, X, Megaphone, BookOpen, Wand2, Code2 } from 'lucide-react';
import { analyzeVideoContent } from '../services/geminiService';

interface PromoFormProps {
  onSubmit: (data: PromoRequest) => void;
  isLoading: boolean;
  language: Language;
}

const PromoForm: React.FC<PromoFormProps> = ({ onSubmit, isLoading, language }) => {
  const [contentType, setContentType] = useState<ContentType>('Promotion');
  
  const [formData, setFormData] = useState<PromoRequest>({
    contentType: 'Promotion',
    productName: '',
    description: '',
    targetAudience: '',
    platform: 'Instagram',
    tone: 'Excited',
    language: language
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, language }));
  }, [language]);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    id: {
      promotion: 'Promosi',
      story: 'Cerita',
      webDev: 'Web Dev',
      uploadVideo: 'Analisis Video Otomatis',
      uploadWeb: 'Upload Demo Website',
      uploadHint: 'Upload video produk/cerita untuk mengisi form secara instan',
      uploadWebHint: 'Upload rekaman layar web Anda. AI akan mengenali fitur & layout.',
      analyzing: 'Sedang menganalisis pixel video...',
      analyzeSuccess: 'Analisis Sukses',
      platform: 'Platform',
      tone: 'Gaya Bahasa (Tone)',
      submitProm: 'Buat Iklan Ajaib',
      submitStory: 'Tulis Cerita',
      submitWeb: 'Showcase Project',
      loading: 'Sedang Meracik Kata...',
      tones: {
        Excited: 'Bersemangat',
        Professional: 'Profesional',
        Casual: 'Santai',
        Luxury: 'Mewah',
        Humorous: 'Humoris',
        Persuasive: 'Persuasif',
        Dramatic: 'Dramatis',
        Inspiring: 'Menginspirasi',
        Spooky: 'Seram',
        Fairytale: 'Dongeng',
        Melancholic: 'Melankolis',
        Suspenseful: 'Menegangkan',
        Technical: 'Teknis',
        Enthusiastic: 'Antusias',
        Minimalist: 'Minimalis',
        Innovative: 'Inovatif',
        'Tutorial Style': 'Gaya Tutorial'
      }
    },
    en: {
      promotion: 'Promotion',
      story: 'Story',
      webDev: 'Web Dev',
      uploadVideo: 'Auto Video Analysis',
      uploadWeb: 'Upload Web Demo',
      uploadHint: 'Upload product/story video to autofill form instantly',
      uploadWebHint: 'Upload screen recording. AI will detect features & layout.',
      analyzing: 'Analyzing video pixels...',
      analyzeSuccess: 'Analysis Success',
      platform: 'Platform',
      tone: 'Tone',
      submitProm: 'Create Magic Ad',
      submitStory: 'Write Story',
      submitWeb: 'Showcase Project',
      loading: 'Crafting Words...',
      tones: {
        Excited: 'Excited',
        Professional: 'Professional',
        Casual: 'Casual',
        Luxury: 'Luxury',
        Humorous: 'Humorous',
        Persuasive: 'Persuasive',
        Dramatic: 'Dramatic',
        Inspiring: 'Inspiring',
        Spooky: 'Spooky',
        Fairytale: 'Fairytale',
        Melancholic: 'Melancholic',
        Suspenseful: 'Suspenseful',
        Technical: 'Technical',
        Enthusiastic: 'Enthusiastic',
        Minimalist: 'Minimalist',
        Innovative: 'Innovative',
        'Tutorial Style': 'Tutorial Style'
      }
    }
  };

  const text = t[language];

  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
    
    let defaultTone = 'Excited';
    if (type === 'Story') defaultTone = 'Dramatic';
    if (type === 'Web Showcase') defaultTone = 'Professional';

    setFormData(prev => ({ 
      ...prev, 
      contentType: type,
      tone: defaultTone
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      