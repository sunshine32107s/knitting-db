'use client';

import { useState } from 'react';
import { Upload, Loader2, Plus } from 'lucide-react';

interface Pattern {
  id: number;
  name: string;
  gauge: string;
  type: string;
  amount: string;
  yarn: string;
  yarnComponent: string;
  note: string;
  imageUrl?: string;
}

const initialData: Pattern[] = [
  { id: 1, name: '울알코 브이넥 조끼', gauge: '11.5*17', type: '조끼', amount: '', yarn: '', yarnComponent: '', note: '' },
  { id: 2, name: 'Calais', gauge: '11.5*18', type: '대바늘 소품', amount: '', yarn: '', yarnComponent: '', note: '영어 / 망토' },
  { id: 3, name: '레인드롭티', gauge: '12*17', type: '스웨터', amount: '780', yarn: '레이니', yarnComponent: '', note: '' },
  { id: 4, name: 'Church of Clouds', gauge: '12*19', type: '스웨터', amount: '', yarn: '', yarnComponent: '', note: '영어 / 목' },
];

export default function Home() {
  const [patterns, setPatterns] = useState<Pattern[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    const fakeImageUrl = URL.createObjectURL(file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('분석 실패');
      
      const aiResult = await response.json();

      const newPattern: Pattern = {
        id: Date.now(),
        name: aiResult.name || '이름 없음',
        gauge: aiResult.gauge || '-',
        type: aiResult.type || '미분류',
        amount: aiResult.amount || '-',
        yarn: aiResult.yarn || '-',
        yarnComponent: aiResult.yarnComponent || '-',
        note: aiResult.note || '-',
        imageUrl: fakeImageUrl
      };

      setPatterns((prev) => [newPattern, ...prev]);
    } catch (error) {
      alert('도안을 읽는 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">📚 나의 독서DB & 도안 저장소</h1>
          <p className="text-sm text-gray-500 mt-1">도안 파일을 드래그하여 업로드하면 AI가 자동으로 표를 채워줍니다.</p>
        </div>

        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if(e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input id="fileInput" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm font-medium text-gray-600">AI가 도안에서 정보를 추출하는 중...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">도안 이미지 또는 PDF 파일을 여기에 떨어뜨리거나 클릭하세요</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <th className="p-3 pl-5 border-r border-gray-200 w-1/4">Aa 이름</th>
                  <th className="p-3 border-r border-gray-200">📊 게이지</th>
                  <th className="p-3 border-r border-gray-200">🧥 종류</th>
                  <th className="p-3 border-r border-gray-200">⚖️ 소요량(m)</th>
                  <th className="p-3 border-r border-gray-200">🗒️ 원작 실</th>
                  <th className="p-3 border-r border-gray-200">🗒️ 원작 실 성분</th>
                  <th className="p-3 border-r border-gray-200">💬 비고</th>
                  <th className="p-3 pl-4">🔗 착샷</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((pattern) => (
                  <tr key={pattern.id} className="border-b border-gray-150 hover:bg-gray-50 transition-colors">
                    <td className="p-3 pl-5 font-semibold text-blue-600 border-r border-gray-200">{pattern.name}</td>
                    <td className="p-3 text-gray-600 border-r border-gray-200">{pattern.gauge}</td>
                    <td className="p-3 border-r border-gray-200">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        pattern.type === '스웨터' ? 'bg-green-100 text-green-800' :
                        pattern.type === '가디건' ? 'bg-blue-100 text-blue-800' :
                        pattern.type === '조끼' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>{pattern.type}</span>
                    </td>
                    <td className="p-3 text-gray-500 border-r border-gray-200">{pattern.amount}</td>
                    <td className="p-3 text-gray-600 border-r border-gray-200">{pattern.yarn}</td>
                    <td className="p-3 text-gray-600 border-r border-gray-200">{pattern.yarnComponent}</td>
                    <td className="p-3 text-gray-500 border-r border-gray-200 text-xs">{pattern.note}</td>
                    <td className="p-3 pl-4">
                      {pattern.imageUrl ? <img src={pattern.imageUrl} alt="preview" className="w-8 h-8 object-cover rounded border border-gray-300" /> : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-gray-50/50 border-t border-gray-200">
            <button onClick={() => setPatterns(prev => [...prev, { id: Date.now(), name: '새 도안 항목', gauge: '', type: '스웨터', amount: '', yarn: '', yarnComponent: '', note: '' }])} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /> 새로 만들기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
