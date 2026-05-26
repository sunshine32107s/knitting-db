'use client';

import { useState } from 'react';
import { Upload, Loader2, Plus, Trash2 } from 'lucide-react';

interface Pattern {
  id: number;
  name: string;
  gauge: string;
  type: string;
  yarn: string;
  yarnComponent: string;
  note: string;
  imageUrl?: string;
}

const initialData: Pattern[] = [
  { id: 1, name: '울알코 브이넥 조끼', gauge: '11.5*17', type: '조끼', yarn: '', yarnComponent: '', note: '' },
  { id: 2, name: 'Calais', gauge: '11.5*18', type: '대바늘 소품', yarn: '', yarnComponent: '', note: '영어 / 망토' },
  { id: 3, name: '레인드롭티', gauge: '12*17', type: '스웨터', yarn: '레이니', yarnComponent: '', note: '' },
  { id: 4, name: 'Church of Clouds', gauge: '12*19', type: '스웨터', yarn: '', yarnComponent: '', note: '영어 / 목' },
];

export default function Home() {
  const [patterns, setPatterns] = useState<Pattern[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (end) => resolve(end.target?.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      let imageUrl = '';
      if (file.type.startsWith('image/')) {
        imageUrl = await fileToDataUrl(file);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('분석 실패');
      
      const aiResult = await response.json();

      const newPattern: Pattern = {
        id: Date.now(),
        name: aiResult.name || '새 도안 항목',
        gauge: aiResult.gauge || '-',
        type: aiResult.type || '미분류',
        yarn: aiResult.yarn || '-',
        yarnComponent: aiResult.yarnComponent || '-',
        note: aiResult.note || '-',
        imageUrl: imageUrl || undefined
      };

      setPatterns((prev) => [newPattern, ...prev]);
    } catch (error) {
      alert('도안을 읽는 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (id: number, field: keyof Pattern, value: string) => {
    setPatterns((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const deleteRow = (id: number) => {
    setPatterns((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-sky-100 via-blue-50 to-emerald-50 p-8 text-gray-800 font-sans tracking-wide">
      
      {/* 구글 웹폰트 'Gowun Dodum' (고운 돋움) 불러오기 */}
      <link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap" rel="stylesheet" />
      <style>{`
        .custom-cute-font {
          font-family: 'Gowun Dodum', sans-serif;
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8 custom-cute-font text-base">
        
        {/* 대제목 영역 */}
        <div>
          <h1 className="text-3xl font-bold text-sky-900 tracking-tight">도안 저장소</h1>
          <p className="text-sm text-sky-600/80 mt-1">도안을 업로드하면 AI가 정리해 줍니다. 직접 수정도 가능해요!</p>
        </div>

        {/* 파일 업로드 영역 */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if(e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all shadow-sm ${
            dragActive ? 'border-sky-400 bg-sky-50/50' : 'border-sky-200 bg-white/80 backdrop-blur-sm hover:border-sky-300'
          }`}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input id="fileInput" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-sky-500 animate-spin" />
              <p className="text-sm font-medium text-sky-800">AI가 도안을 열심히 읽고 있어요...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5">
              <Upload className="w-7 h-7 text-sky-400" />
              <p className="text-sm font-medium text-sky-700">여기에 도안 이미지나 PDF를 올려주세요. 채우는 건 AI가 할게요!</p>
            </div>
          )}
        </div>

        {/* 도안 테이블 영역 */}
        <div className="bg-white/95 backdrop-blur-sm border border-sky-100 rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
              <thead>
                {/* 제목행 우측 정렬 대신text-center(가운데정렬) 클래스 부여 */}
                <tr className="bg-sky-50/70 border-b border-sky-100 text-sky-900 font-bold text-center">
                  <th className="p-3 border-r border-sky-100 w-[22%]">이름</th>
                  <th className="p-3 border-r border-sky-100 w-[12%]">게이지</th>
                  <th className="p-3 border-r border-sky-100 w-[13%]">종류</th>
                  <th className="p-3 border-r border-sky-100 w-[15%]">원작 실</th>
                  <th className="p-3 border-r border-sky-100 w-[15%]">원작 실 성분</th>
                  <th className="p-3 border-r border-sky-100 w-[15%]">비고</th>
                  <th className="p-3 border-r border-sky-100 w-[8%]">착샷</th>
                  <th className="p-3 w-[5%]">삭제</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((pattern) => (
                  <tr key={pattern.id} className="border-b border-sky-50 hover:bg-sky-50/30 transition-colors">
                    
                    {/* 이름 */}
                    <td className="p-2 border-r border-sky-100 whitespace-pre-wrap break-all">
                      <textarea rows={1} value={pattern.name} onChange={(e) => handleCellChange(pattern.id, 'name', e.target.value)} className="w-full bg-transparent px-2 py-1 font-bold text-sky-700 focus:bg-white focus:outline-sky-200 resize-none rounded overflow-hidden" />
                    </td>
                    {/* 게이지 */}
                    <td className="p-2 border-r border-sky-100 whitespace-pre-wrap break-all">
                      <textarea rows={1} value={pattern.gauge} onChange={(e) => handleCellChange(pattern.id, 'gauge', e.target.value)} className="w-full bg-transparent px
