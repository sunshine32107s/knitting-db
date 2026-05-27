'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Camera } from 'lucide-react';

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
  const rowImageInputRef = useRef<{ [key: number]: HTMLInputElement | null }>({});

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

  // 📋 화면 어디서든 이미지를 붙여넣었을 때, 현재 마우스가 위치한 행을 찾아 사진을 매칭해주는 글로벌 감지 장치
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const hoveredRow = document.querySelector('tr:hover');
      if (!hoveredRow) return;
      
      const patternId = hoveredRow.getAttribute('data-id');
      if (!patternId) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await handleRowImageUpload(Number(patternId), file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
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
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('분석 실패');
      
      const aiResult = await response.json();
      
      let displayGauge = aiResult.gauge ? String(aiResult.gauge).replace(/\s+/g, '') : '';
      if (!displayGauge || displayGauge === '-') {
        displayGauge = '0'; 
      }

      const newPattern = {
        name: aiResult.name || '새 도안 항목',
        gauge: displayGauge,
        type: aiResult.type || '미분류',
        yarn: aiResult.yarn || '-',
        yarnComponent: aiResult.yarnComponent || '-',
        note: aiResult.note || '-',
        imageUrl: '' 
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
    const cleanedValue = field === 'gauge' ? value.replace(/\s+/g, '') : value;

    setPatterns((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: cleanedValue } : item))
    );

    try {
      await fetch('/api/patterns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value: cleanedValue }),
      });
      setTimeout(adjustTextareasHeight, 10);
    } catch (error) {
      console.error('업데이트 실패:', error);
    }
  };

  const handleRowImageUpload = async (id: number, file: File) => {
    try {
      const base64Url = await fileToDataUrl(file);
      setPatterns((prev) =>
        prev.map((item) => (item.id === id ? { ...item, imageUrl: base64Url } : item))
      );
      await fetch('/api/patterns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field: 'imageUrl', value: base64Url }),
      });
    } catch (error) {
      alert('이미지 업로드에 실패했습니다.');
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
      gauge: '0', 
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

  const formatGaugeDisplay = (gaugeText: string) => {
    if (!gaugeText.includes('💙')) return gaugeText;
    
    const parts = gaugeText.split('💙');
    return (
      <span className="inline-flex items-center justify-center font-semibold text-gray-500 text-sm">
        {parts[0]}
        <span className="inline-block align-middle transform -translate-y-[0.5px] mx-[1px] text-[10px] select-none text-sky-500">💙</span>
        {parts[1]}
      </span>
    );
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
          onDragLeave={() => setDragActive(false)} // 👈 [수정 완료] 지난번 에러 났던 오타 교정함
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
                  <th className="p-1.5 border-r border-sky-100 w-[17%] cursor-pointer hover:bg-sky-100/50 transition-colors" onClick={() => handleSort('note')}>
                    <div className="flex items-center justify-center gap-1">특징 {renderSortIcon('note')}</div>
                  </th>
                  <th className="p-1.5 border-r border-sky-100 w-[16%] cursor-pointer hover:bg-sky-100/50 transition-colors" onClick={() => handleSort('yarn')}>
                    <div className="flex items-center justify-center gap-1">원작 실 {renderSortIcon('yarn')}</div>
                  </th>
                  <th className="p-1.5 border-r border-sky-100 w-[19%] cursor-pointer hover:bg-sky-100/50 transition-colors" onClick={() => handleSort('yarnComponent')}>
                    <div className="flex items-center justify-center gap-1">원작 실 성분 {renderSortIcon('yarnComponent')}</div>
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
                    <tr key={pattern.id} data-id={pattern.id} className="border-b border-sky-50 hover:bg-sky-50/30 transition-colors text-sm group/row">
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.name} onChange={(e) => handleCellChange(pattern.id, 'name', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-bold text-blue-700 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100 relative">
                        <div className="flex items-center justify-center min-h-[34px] w-full relative group">
                          <textarea rows={1} value={pattern.gauge} onChange={(e) => handleCellChange(pattern.id, 'gauge', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-semibold text-gray-500 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm focus:opacity-100 opacity-0 absolute inset-0 z-10" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                          <div className="pointer-events-none w-full text-center py-1 select-none block group-focus-within:hidden z-0">
                            {formatGaugeDisplay(pattern.gauge)}
                          </div>
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.type} onChange={(e) => handleCellChange(pattern.id, 'type', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-semibold text-gray-500 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.note} onChange={(e) => handleCellChange(pattern.id, 'note', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-semibold text-gray-500 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.yarn} onChange={(e) => handleCellChange(pattern.id, 'yarn', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-semibold text-gray-500 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      <td className="p-1 border-r border-sky-100">
                        <div className="flex items-center justify-center min-h-[34px] w-full">
                          <textarea rows={1} value={pattern.yarnComponent} onChange={(e) => handleCellChange(pattern.id, 'yarnComponent', e.target.value)} className="w-full bg-transparent px-1.5 py-1 font-semibold text-gray-500 text-center focus:bg-white focus:outline-sky-200 rounded resize-none overflow-hidden text-sm" onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }} />
                        </div>
                      </td>
                      {/* 🔍 [기능 업그레이드] 착샷 마우스 오버 시 공중 부양 미리보기 팝업 구현 */}
                      <td className="p-1 border-r border-sky-100 text-center relative">
                        <div className="flex justify-center items-center min-h-[34px] w-full">
                          <input type="file" accept="image/*" className="hidden" ref={(el) => { rowImageInputRef.current[pattern.id] = el; }} onChange={(e) => { if (e.target.files?.[0]) handleRowImageUpload(pattern.id, e.target.files[0]); }} />
                          
                          <div className="relative group/preview inline-block">
                            <button 
                              onClick={() => rowImageInputRef.current[pattern.id]?.click()} 
                              className="group/btn relative flex items-center justify-center w-8 h-8 rounded-lg border border-sky-200 bg-sky-50/30 hover:bg-sky-100/50 transition-all overflow-hidden shadow-sm" 
                              title="클릭 시 업로드, 혹은 이 줄에 마우스를 대고 Ctrl+V"
                            >
                              {pattern.imageUrl ? (
                                <>
                                  <img src={pattern.imageUrl} alt="preview" className="w-full h-full object-cover group-hover/btn:opacity-40 transition-opacity" />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                    <Camera className="w-3.5 h-3.5 text-sky-700" />
                                  </div>
                                </>
                              ) : (
                                <Camera className="w-4 h-4 text-sky-400 group-hover/btn:text-sky-600 transition-colors" />
                              )}
                            </button>

                            {/* ✨ 마우스를 올렸을 때만 공중에 붕 뜨는 고해상도 미리보기 액자 태그 */}
                            {pattern.imageUrl && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/preview:block z-50 pointer-events-none animate-in fade-in duration-200">
                                <div className="p-1.5 bg-white border border-sky-200 rounded-xl shadow-xl bg-white/95 backdrop-blur-sm">
                                  <img 
                                    src={pattern.imageUrl} 
                                    alt="Large Preview" 
                                    className="w-32 h-32 object-cover rounded-lg border border-sky-100"
                                  />
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-sky-200 rotate-45"></div>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </td>
                      <td className="p-1 text-center">
                        <div className="flex justify-center items-center min-h-[34px] w-full">
                          <button onClick={() => deleteRow(pattern.id)} className="text-neutral-400 hover:text-red-500 p-1 transition-colors">
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
