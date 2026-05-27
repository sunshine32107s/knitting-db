import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: file.type
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        filePart,
        `당신은 뜨개질 도안 전문 분석가입니다. 첨부된 파일(이미지 또는 PDF)을 분석하여 아래 JSON 구조로 응답해주세요.
        
        [게이지(gauge) 규칙 - 빈칸 및 공백 절대 금지]:
        - '코', '단', 'sts', 'rows' 같은 문자는 무조건 제외하고 "오직 숫자와 파란하트(💙) 기호"만 넣으세요.
        - 코수와 단수가 모두 있다면 두 숫자 사이에 파란하트(💙) 기호를 넣으세요. (예: 22💙30)
        - 중요: 숫자와 하트 기호 사이에 띄어쓰기(공백)를 절대로 넣지 마세요. 
        - 만약 게이지 정보가 도안에서 전혀 발견되지 않거나 비어있다면, 무조건 숫자 '0' 하나만 적으세요.

        [종류(type) 규칙]:
        - 의류의 종류는 영어(예: pullover, cardigan)를 절대 사용하지 말고, 100% 한글로만 번역해서 대답하세요. (예: 풀오버, 가디건, 조끼)

        [영어 도안 판별 및 특징(note) 규칙]:
        - 분석 중인 도안이 '영어'로 작성된 도안인지 확인하세요. 영어 도안인 경우, 'note' 칸의 가장 첫머리에 반드시 "영어" 단어를 포함하여 요약해 주세요. (예: "영어, 4mm 바늘 사용, 탑다운 구조")

        응답 형식(마크다운 태그 없이 순수 JSON만 응답):
        {
          "name": "도안 이름",
          "gauge": "22💙30 또는 22 또는 0 형식의 공백 없는 순수 숫자와 하트 조합",
          "isPatternGauge": 무늬게이지여부(true/false),
          "type": "한글로 된 의류 종류",
          "yarn": "원작 실 이름",
          "yarnComponent": "도안에서 찾아낸 실의 성분 정보",
          "note": "영어 도안인 경우 반드시 '영어' 단어를 첫머리에 포함한 핵심 특이사항 요약"
        }`
      ]
    });

    const text = response.text || '{}';
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('AI 분석 에러:', error);
    return NextResponse.json({ error: 'AI 분석 실패', details: error.message }, { status: 500 });
  }
}
