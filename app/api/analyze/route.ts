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
        `당신은 뜨개질 도안 전문 분석가입니다. 첨부된 파일(이미지/PDF)을 분석하여 아래 JSON 구조로 응답해주세요.
        
        [게이지(gauge) 추출 규칙 - 엄격]:
        - 게이지 칸에는 '코', '단', 'sts', 'rows', '무늬' 같은 텍스트를 절대 포함하지 마세요. 오직 "숫자"와 "구분자(*)"만 허용합니다.
        - 코수와 단수가 모두 있다면 예시처럼 코수와 단수 사이에 곱하기(*) 기호를 넣으세요. (예: 22 * 30)
        - 단수 정보 없이 코수만 적혀 있다면, 다른 글자나 기호 없이 오직 "코수 숫자"만 단독으로 적으세요. (예: 22)

        [착샷(imageUrl) 추출 규칙 - 엄격]:
        - 도안에서 작품의 실제 완성 모습이나 모델이 착용하고 있는 "실제 사진(착샷)" 영역을 찾아내야 합니다.
        - 글자만 빽빽한 곳이나 기호가 그려진 서술형/차트 도안 영역을 착샷으로 오인하여 추출하면 절대 안 됩니다. 실제 편물 사진이 없다면 차라리 빈칸으로 두세요.

        [웹 검색 활용]:
        - 도안에 실 이름은 있으나 '원작 실 성분(yarnComponent)' 정보가 없다면, 구글 검색 도구를 사용하여 해당 실의 실제 성분(예: 울 100%)을 찾아내 기재하세요.

        응답 형식(마크다운 태그 없이 순수 JSON만 응답):
        {
          "name": "도안 이름",
          "gauge": "22 또는 22 * 30 형식의 순수 숫자 구성",
          "isPatternGauge": 무늬게이지여부(true/false),
          "type": "의류 종류",
          "yarn": "원작 실 이름",
          "yarnComponent": "인터넷 검색 또는 도안에서 찾아낸 실 성분",
          "note": "특이사항 요약"
        }`
      ],
      tools: [{ googleSearch: {} }] 
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
