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
    // [변경 3, 4] 하늘색 그라데이션 배경 적용 및 귀여운 둥근 폰트(국내 웹 폰트 대용) 테일윈드 내장 클래스 적용
    <div className="min-h-screen bg-gradient-to-tr from-sky-100 via-blue-50 to-emerald-50 p-8 text-gray-800 font-sans tracking-wide">
      
      {/* 구글 웹폰트 'Gamja Flower' (귀여운 글씨체) 실시간 주입 */}
      <link href="https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap" rel="stylesheet" />
      <style>{`
        .custom-cute-font {
          font-family: 'Gamja Flower', cursive, sans-serif;
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8 custom-cute-font text-xl">
        
        {/* [변경 1] 대제목 변경 및 이모지 삭제 */}
        <div>
          <h1 className="text-4xl font-bold text-sky-900">도안 저장소</h1>
          <p className="text-base text-sky-600/80 mt-1.5">도안을 업로드하면 AI가 정리해 줍니다. 직접 수정도 가능해요!</p>
        </div>

        {/* 파일 업로드 영역 */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if(e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all shadow-sm ${
            dragActive ? 'border-sky-400 bg-sky-50/50' : 'border-sky-200 bg-white/80 backdrop-blur-sm hover:border-sky-300'
          }`}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input id="fileInput" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-lg font-medium text-sky-800">AI가 도안을 열심히 읽고 있어요...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="w-8 h-8 text-sky-400" />
              <p className="text-lg font-medium text-sky-700">여기에 도안 이미지나 PDF를 올려주세요 채우는 건 AI가 할게요!</p>
            </div>
          )}
        </div>

        {/* [변경 5] 자동 줄바꿈 및 최적화된 고정 열너비(table-fixed) 시스템 적용 */}
        <div className="bg-white/95 backdrop-blur-sm border border-sky-100 rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-lg table-fixed min-w-[900px]">
              <thead>
                {/* [변경 2] 모든 열 제목에서 아이콘/이모지 삭제 및 고정 너비 설정 */}
                <tr className="bg-sky-50/70 border-b border-sky-100 text-sky-900 font-semibold">
                  <th className="p-3 pl-5 border-r border-sky-100 w-[22%]">이름</th>
                  <th className="p-3 border-r border-sky-100 w-[12%]">게이지</th>
                  <th className="p-3 border-r border-sky-100 w-[13%]">종류</th>
                  <th className="p-3 border-r border-sky-100 w-[15%]">원작 실</th>
                  <th className="p-3 border-r border-sky-100 w-[15%]">원작 실 성분</th>
                  <th className="p-3 border-r border-sky-100 w-[15%]">비고</th>
                  <th className="p-3 border-r border-sky-100 text-center w-[8%]">착샷</th>
                  <th className="p-3 text-center w-[5%]">삭제</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((pattern) => (
                  <tr key={pattern.id} className="border-b border-sky-50 hover:bg-sky-50/30 transition-colors">
                    
                    {/* [변경 5] 모든 칸에 자동 줄바꿈(whitespace-pre-wrap break-all) 속성 추가 */}
                    
                    {/* 이름 */}
                    <td className="p-2 border-r border-sky-100 whitespace-pre-wrap break-all">
                      <textarea rows={1} value={pattern.name} onChange={(e) => handleCellChange(pattern.id, 'name', e.target.value)} className="w-full bg-transparent px-3 py-1 font-bold text-sky-700 focus:bg-white focus:outline-sky-300 resize-none rounded overflow-hidden" />
                    </td>
                    {/* 게이지 */}
                    <td className="p-2 border-r border-sky-100 whitespace-pre-wrap break-all">
                      <textarea rows={1} value={pattern.gauge} onChange={(e) => handleCellChange(pattern.id, 'gauge', e.target.value)} className="w-full bg-transparent px-2 py-1 text-gray-700 focus:bg-white focus:outline-sky-300 resize-none rounded overflow-hidden" />
                    </td>
                    {/* 종류 */}
                    <td className="p-2 border-r border-sky-100 whitespace-pre-wrap break-all">
                      <textarea rows={1} value={pattern.type} onChange={(e) => handleCellChange(pattern.id, 'type', e.target.value)} className="w-full bg-transparent px-2 py-1 text-gray-700 focus:bg-white focus:outline-sky-300 resize-none rounded overflow-hidden" />
                    </td>
                    {/* 원작실 */}
                    <td className="p-2 border-r border-sky-100 whitespace-pre-wrap break-all">
                      <textarea rows={1} value={pattern.yarn} onChange={(e) => handleCellChange(pattern.id, 'yarn', e.target.value)} className="w-full bg-transparent px-2 py-1 text-gray-700 focus:bg-white focus:outline-sky-300 resize-none rounded overflow-hidden" />
                    </td>
                    {/* 성분 */}
                    <td className="p-2 border-r border-sky-100 whitespace-pre-wrap break-all">
                      <textarea rows={1} value={pattern.yarnComponent} onChange={(e) => handleCellChange(pattern.id, 'yarnComponent', e.target.value)} className="w-full bg-transparent px-2 py-1 text-gray-700 focus:bg-white focus:outline-sky-300 resize-none rounded overflow-hidden" />
                    </td>
                    {/* 비고 */}
                    <td className="p-2 border-r border-sky-100 whitespace-pre-wrap break-all">
                      <textarea rows={1} value={pattern.note} onChange={(e) => handleCellChange(pattern.id, 'note', e.target.value)} className="w-full bg-transparent px-2 py-1 text-gray-600 text-base focus:bg-white focus:outline-sky-300 resize-none rounded overflow-hidden" />
                    </td>
                    
                    {/* 착샷 */}
                    <td className="p-2 border-r border-sky-100 text-center">
                      <div className="flex justify-center items-center">
                        {pattern.imageUrl ? (
                          <img src={pattern.imageUrl} alt="preview" className="w-12 h-12 object-cover rounded-xl border border-sky-200 shadow-sm" />
                        ) : (
                          <span className="text-gray-300 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    {/* 삭제 */}
                    <td className="p-2 text-center">
                      <button onClick={() => deleteRow(pattern.id)} className="text-gray-400 hover:text-red-400 p-1 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-sky-50/20 border-t border-sky-50">
            <button onClick={() => setPatterns(prev => [{ id: Date.now(), name: '새 도안 항목', gauge: '', type: '', yarn: '', yarnComponent: '', note: '' }, ...prev])} className="flex items-center gap-1.5 text-base text-sky-600 hover:text-sky-800 font-semibold transition-colors">
              <Plus className="w-4 h-4" /> 새로 만들기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
