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
        - '코', '단', 'sts', 'rows' 같은 문자는 무조건 제외하고 "오직 숫자와 곱하기(*) 기호"만 넣으세요.
        - ⚠️ 중요: 숫자와 기호 사이에 띄어쓰기(공백)를 절대로 넣지 마세요. 
          * 올바른 예: 22*30 또는 22
          * 잘못된 예: 22 * 30 (공백이 있음), 22 (뒤에 공백이 붙음)
        - 만약 게이지 정보가 도안에서 전혀 발견되지 않거나 비어있다면, 빈칸으로 두지 말고 무조건 숫자 '0' 하나만 적으세요.

        [종류(type) 규칙 - 무조건 한글]:
        - 의류의 종류는 영어(예: pullover, cardigan, vest)를 절대 사용하지 말고, 100% 한글로만 번역해서 대답하세요.
          * 올바른 예: 풀오버, 가디건, 조끼, 스웨터, 머플러, 장갑
          * 잘못된 예: Top-down Pullover, Vest, Cardigan

        응답 형식(마크다운 태그 없이 순수 JSON만 응답):
        {
          "name": "도안 이름",
          "gauge": "22*30 또는 22 또는 0 형식의 공백 없는 순수 숫자 조합",
          "isPatternGauge": 무늬게이지여부(true/false),
          "type": "한글로 된 의류 종류",
          "yarn": "원작 실 이름",
          "yarnComponent": "도안에서 찾아낸 실의 성분 정보",
          "note": "바늘 정보 및 특이사항"
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
