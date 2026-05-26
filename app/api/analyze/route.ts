import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 업로드되지 않았습니다.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const prompt = `
      당신은 뜨개질 도안 분석 전문가입니다. 첨부된 뜨개질 도안 파일(이미지 또는 문서)을 읽고, 
      다음 구조에 맞는 정보를 정확하게 추출해 주세요. 도안에 명시되지 않은 정보는 빈 문자열로 두세요.
      
      - 이름: 작품의 이름 또는 도안명
      - 게이지: 게이지 정보 (예: '11.5*17', '18*24' 등 수치 형태 우선)
      - 종류: 스웨터, 가디건, 조끼, 대바늘 소품 등 카테고리 분류
      - 소요량: 필요한 실의 양 (m 또는 볼 단위 숫자만 추출)
      - 원작실: 도안에 사용된 원작 실 이름
      - 원작실성분: 실의 성분 (울, 캐시미어 등)
      - 비고: 언어 정보(영어, 한글) 및 특이사항 (예: '영어 / 망토', '영어 / 소매')
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: file.type,
          },
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "작품명" },
            gauge: { type: Type.STRING, description: "게이지 (예: 12*17)" },
            type: { type: Type.STRING, description: "종류 (스웨터, 가디건, 조끼, 대바늘 소품 등)" },
            amount: { type: Type.STRING, description: "소요량" },
            yarn: { type: Type.STRING, description: "원작 실" },
            yarnComponent: { type: Type.STRING, description: "원작 실 성분" },
            note: { type: Type.STRING, description: "비고 (언어 및 특징)" },
          },
          required: ["name", "gauge", "type"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("AI가 응답을 생성하지 못했습니다.");
    }

    const patternData = JSON.parse(resultText);
    return NextResponse.json(patternData);

  } catch (error) {
    console.error('분석 에러:', error);
    return NextResponse.json({ error: '도안을 분석하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
