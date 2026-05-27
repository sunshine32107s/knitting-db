'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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

type SortField = 'name' | 'gauge' | 'type' | 'yarn' | 'yarnComponent' | 'note';
type SortOrder = 'asc' | 'desc' | null;

export default function Home() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    fetchPatterns();
  }, []);

  const adjustTextareasHeight = () => {
    if (tableBodyRef.current) {
      const textareas = tableBodyRef.current.querySelectorAll('textarea');
      textareas.forEach((textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      });
    }
  };

  useEffect(() => {
    if (!dataLoading && patterns.length > 0) {
      setTimeout(adjustTextareasHeight, 50);
    }
  }, [patterns, sortField, sortOrder, dataLoading]);

  useEffect(() => {
    window.addEventListener('resize', adjustTextareasHeight);
    return () => {
      window.removeEventListener('resize', adjustTextareasHeight);
    };
  }, [patterns]);

  const fetchPatterns = async () => {
    try {
      setDataLoading(true);
      const response = await fetch('/api/patterns');
      if (response.ok) {
        const data = await response.json();
        setPatterns(data);
      }
    } catch (error) {
      console.error('도안을 불러오는 중 오류 발생:', error);
    } finally {
      setDataLoading(false);
    }
  };

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
      const displayGauge = aiResult.gauge || '-';

      const newPattern = {
        name: aiResult.name || '새 도안 항목',
        gauge: displayGauge,
        type: aiResult.type || '미분류',
        yarn: aiResult.yarn || '-',
        yarnComponent: aiResult.yarnComponent || '-',
        note: aiResult.note || '-',
        imageUrl: imageUrl || ''
      };

      const saveResponse = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPattern),
      });

      if (saveResponse.ok) {
        fetchPatterns();
      }
    } catch (error) {
      alert('도안을 읽거나 저장하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = async (id: number, field: keyof Pattern, value: string) => {
    setPatterns((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );

    try {
      await fetch('/api/patterns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value }),
      });
      setTimeout(adjustTextareasHeight, 10);
    } catch (error) {
      console.error('업데이트 실패:', error);
    }
  };

  const deleteRow = async (id: number) => {
    setPatterns((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/patterns?id=${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  const handleAddRow = async () => {
    const emptyRow = {
      name: '새 도안 항목',
      gauge: '',
      type: '',
      yarn: '',
      yarnComponent: '',
      note: '',
      imageUrl: ''
    };

    try {
      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emptyRow),
      });
      if (response.ok) fetchPatterns();
    } catch (error) {
      console.error('추가 실패:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    if (sortOrder === 'asc') return <ArrowUp className="w-3.5 h-3.5 text-blue-700" />;
    return <ArrowDown className="w-3.5 h-3.5 text-blue-700" />;
  };

  const getSortedPatterns = () => {
    if (!sortField || !sortOrder) return patterns;

    return [...patterns].sort((a, b) => {
      const valueA = String(a[sortField] || '').toLowerCase();
      const valueB = String(b[sortField] || '').toLowerCase();

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedPatterns = getSortedPatterns();

  return (
    <div className="min-h-screen bg-gradient-to-tr from-sky-100 via-blue-50 to-emerald-50 p-4 md:p-8 text-gray-900 font-sans tracking-wide">
      <link href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap" rel="stylesheet" />
      <style>{`.custom-cute-font { font-family: 'Gowun Dodum', sans-serif; }`}</style>

      <div className="max-w-7xl mx-auto space-y-6 custom-cute-font text-sm">
        
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-3xl font-bold text-sky-900 tracking-tight">고래고래 도안 분석소</h1>
            <img src="/whale_m.gif" alt="title whale" className="w-16 h-16 object-contain" />
          </div>
          <p className="text-sm text-sky-600/80">도안을 업로드하면 AI가 꼼꼼하게 분석해 줍니다. 헤더를 클릭해 정렬해 보세요!</p>
        </div>

        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if(e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all shadow-sm ${
            dragActive ? 'border-sky-400 bg-sky-50/50' : 'border-sky-200 bg-white/80 backdrop-blur-sm hover:border-sky-300'
          }`}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input id="fileInput" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { if(e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          
          {loading ? (
            <div className="flex flex-row items-center justify-center gap-3 py-1">
              <img src="/whale.gif" alt="whale loading" className="w-12 h-12 object-contain" />
              <p className="text-sm font-medium text-sky-800">고래가 코수와 단수를 꼼꼼히 확인하고 있어요...</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-1">
              <Upload className="w-5 h-5 text-sky-400" />
              <p className="text-sm font-medium text-gray-700">여기에 도안 이미지나 PDF를 올려주세요. 채우는 건 AI가 할게요!</p>
            </div>
          )}
        </div>

        <div className="bg-white/95 backdrop-blur-sm border border-sky-100 rounded-2xl overflow-hidden shadow-md w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse table-fixed min-w-[850px]">
              <thead>
                <tr className="bg-sky-50/70 border-b border-sky-100 text-sky-950 font-bold text-center text-sm select-none">
                  <th className="p-1.5 border-r border-sky-100 w-[18%] cursor-pointer hover:bg-sky-100/50 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center justify-center gap-1">이름 {renderSortIcon('name')}</div>
                  </th>
                  <th className="p-1.5 border-r border-sky-100 w-[11%] cursor-pointer hover:bg-sky-100/50 transition-colors" onClick={() => handleSort('gauge')}>
                    <div className="flex items-center justify-center gap-1">게이지 {renderSortIcon('gauge')}</div>
                  </th>
                  <th className="p-1.5 border-r border-sky-100 w-[11%] cursor-pointer hover:bg-sky-100/50 transition-colors" onClick={() => handleSort('type')}>
                    <div className="flex items-center justify-center gap-1">종류 {renderSortIcon('type')}</div>
                  </th>
                  <th className="p-1.5 border-r border-sky-100 w-[16%] cursor-pointer hover:bg-sky-100/50 transition-colors" onClick={() => handleSort('yarn')}>
                    <div className="flex items-center justify-center gap-1">원작 실 {renderSortIcon('yarn')}</div>
                  </th>
                  <th className="p-1.5 border-r border-sky-100 w-[19%] cursor-pointer hover:bg-sky-100/50 transition-colors" onClick={() => handleSort('yarnComponent')}>
                    <div className="flex items-center justify-center gap-1">원작 실 성분 {renderSortIcon('yarnComponent')}</div>
                  </th>
                  <th className="p-1.5 border-r border-sky-100 w-[17%] cursor-pointer hover:bg-sky-100/50 transition-colors" onClick={() => handleSort('note')}>
                    <div className="flex items-center justify-center gap-1">특징 {renderSortIcon('note')}</div>
                  </th>
                  <th className="p-1.5 border-r border-sky-100 w-[5%]">착샷</th>
                  <th className="p-1.5 w-[4%]">삭제</th>
                </tr>
              </thead>
              <tbody ref={tableBodyRef}>
                {dataLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 text-sm">
                      창고에서 도안 데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : sortedPatterns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 text-sm">
                      아직 저장된 도안이 없습니다. 첫 도안을 등록해 보세요! 🧶
                    </td>
                  </tr>
                ) : (
                  sortedPatterns.map((pattern) => (
                    <tr key={pattern.id} className="border-b border-sky-50 hover:bg-sky-50/30 transition-colors text-sm">
                      {/* 📐 [수정] 각 셀에 flex와 items-center를 주어 내부 textarea가 무조건 수직 정중앙에 위치하도록 전면 교정 */}
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.name} onChange={(e) => handleCellChange(pattern.id, 'name', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-bold text-blue-700 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.gauge} onChange={(e) => handleCellChange(pattern.id, 'gauge', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-bold text-gray-950 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.type} onChange={(e) => handleCellChange(pattern.id, 'type', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-bold text-gray-950 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.yarn} onChange={(e) => handleCellChange(pattern.id, 'yarn', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-bold text-gray-950 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.yarnComponent} onChange={(e) => handleCellChange(pattern.id, 'yarnComponent', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-bold text-gray-950 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.note} onChange={(e) => handleCellChange(pattern.id, 'note', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-bold text-gray-950 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100 text-center">
                        <div className="flex justify-center items-center min-h-[34px] w-full">
                          {pattern.imageUrl ? (
                            <img src={pattern.imageUrl} alt="preview" className="w-8 h-8 object-cover rounded-lg border border-sky-200 shadow-sm" />
                          ) : (
                            <span className="text-gray-500 font-bold text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-1 text-center">
                        <div className="flex justify-center items-center min-h-[34px] w-full">
                          <button onClick={() => deleteRow(pattern.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-sky-50/20 border-t border-sky-50">
            <button onClick={handleAddRow} className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800 font-semibold transition-colors">
              <Plus className="w-3.5 h-3.5" /> 새로 만들기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
