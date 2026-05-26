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

  // 이미지 파일을 Base64 문자열로 변환하여 브라우저에 임시 저장하는 함수 (착샷 노출용)
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
      // 착샷용 이미지 미리보기 데이터 생성
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

  // 실시간 텍스트 수정 기능 함수
  const handleCellChange = (id: number, field: keyof Pattern, value: string) => {
    setPatterns((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const deleteRow = (id: number) => {
    setPatterns((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">📚 나의 독서DB & 도안 저장소</h1>
          <p className="text-sm text-gray-500 mt-1">칸을 클릭하면 내용을 직접 수정할 수 있습니다. 도안을 올리면 AI가 자동으로 채워줍니다.</p>
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
                  <th className="p-3 border-r border-gray-200">🗒️ 원작 실</th>
                  <th className="p-3 border-r border-gray-200">🗒️ 원작 실 성분</th>
                  <th className="p-3 border-r border-gray-200">💬 비고</th>
                  <th className="p-3 border-r border-gray-200 text-center w-16">🔗 착샷</th>
                  <th className="p-3 text-center w-12">삭제</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((pattern) => (
                  <tr key={pattern.id} className="border-b border-gray-150 hover:bg-gray-50 transition-colors">
                    {/* 이름 수정 */}
                    <td className="p-2 border-r border-gray-200">
                      <input type="text" value={pattern.name} onChange={(e) => handleCellChange(pattern.id, 'name', e.target.value)} className="w-full bg-transparent px-3 py-1 font-semibold text-blue-600 focus:bg-white focus:outline-blue-400 rounded" />
                    </td>
                    {/* 게이지 수정 */}
                    <td className="p-2 border-r border-gray-200">
                      <input type="text" value={pattern.gauge} onChange={(e) => handleCellChange(pattern.id, 'gauge', e.target.value)} className="w-full bg-transparent px-2 py-1 text-gray-600 focus:bg-white focus:outline-blue-400 rounded" />
                    </td>
                    {/* 종류 수정 */}
                    <td className="p-2 border-r border-gray-200">
                      <input type="text" value={pattern.type} onChange={(e) => handleCellChange(pattern.id, 'type', e.target.value)} className="w-full bg-transparent px-2 py-1 text-gray-600 focus:bg-white focus:outline-blue-400 text-xs font-medium rounded" />
                    </td>
                    {/* 원작실 수정 */}
                    <td className="p-2 border-r border-gray-200">
                      <input type="text" value={pattern.yarn} onChange={(e) => handleCellChange(pattern.id, 'yarn', e.target.value)} className="w-full bg-transparent px-2 py-1 text-gray-600 focus:bg-white focus:outline-blue-400 rounded" />
                    </td>
                    {/* 성분 수정 */}
                    <td className="p-2 border-r border-gray-200">
                      <input type="text" value={pattern.yarnComponent} onChange={(e) => handleCellChange(pattern.id, 'yarnComponent', e.target.value)} className="w-full bg-transparent px-2 py-1 text-gray-600 focus:bg-white focus:outline-blue-400 rounded" />
                    </td>
                    {/* 비고 수정 */}
                    <td className="p-2 border-r border-gray-200">
                      <input type="text" value={pattern.note} onChange={(e) => handleCellChange(pattern.id, 'note', e.target.value)} className="w-full bg-transparent px-2 py-1 text-gray-500 text-xs focus:bg-white focus:outline-blue-400 rounded" />
                    </td>
                    {/* 착샷 이미지 미리보기 */}
                    <td className="p-2 border-r border-gray-200 text-center flex justify-center items-center">
                      {pattern.imageUrl ? (
                        <img src={pattern.imageUrl} alt="preview" className="w-10 h-10 object-cover rounded border border-gray-300 shadow-sm" />
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    {/* 행 삭제 버튼 */}
                    <td className="p-2 text-center">
                      <button onClick={() => deleteRow(pattern.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-gray-50/50 border-t border-gray-200">
            <button onClick={() => setPatterns(prev => [{ id: Date.now(), name: '새 도안 항목', gauge: '', type: '스웨터', yarn: '', yarnComponent: '', note: '' }, ...prev])} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /> 새로 만들기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
