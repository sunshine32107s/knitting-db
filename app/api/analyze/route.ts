import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// 🤖 구글 AI 클라이언트 호출 (컴파일 에러가 없는 안정적인 구조)
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

    // 🧠 에러를 일으키는 tools를 제거하고 지시문을 극대화한 핵심 코드
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        filePart,
        `당신은 뜨개질 도안 전문 분석가입니다. 첨부된 파일(이미지 또는 PDF)의 텍스트와 레이아웃을 정밀 분석하여 아래 JSON 구조로 응답해주세요.
        
        [게이지(gauge) 규칙 - 초강력 엄격]:
        - '코', '단', 'sts', 'rows', '무늬' 같은 문자는 절대 제외하고 "오직 숫자"만 넣으세요.
        - 코수와 단수가 모두 있다면 두 숫자 사이에 기호(*)를 넣으세요. (예: 22 * 30)
        - 단수 없이 코수만 적혀 있다면, 기호나 글자 없이 오직 "코수 숫자 하나"만 깔끔하게 적으세요. (예: 22)

        [실 성분(yarnComponent) 규칙]:
        - 도안 내부, 혹은 도안 맨 뒤 상세 페이지나 세탁 가이드에 숨겨진 실의 상세 성분 정보(예: 울 100%, 코튼 50% 아크릴 50%)를 샅샅이 뒤져서 찾아내 기재하세요. 

        [착샷(imageUrl) 규칙]:
        - 파일 내에 모델이 옷을 입고 있는 실제 사진(착샷) 영역이 발견되면 그 주소를 제공하되, 글자나 기호 가득한 서술형 도안/기호 도안 차트 영역을 착샷으로 오인하여 주소를 추출하면 절대로 안 됩니다. 뚜렷한 실제 편물 사진이 없다면 빈 칸으로 두세요.

        응답 형식(오직 아래 구조의 순수 JSON으로만 응답하고 마크다운 따옴표는 제거하세요):
        {
          "name": "도안 이름",
          "gauge": "22 또는 22 * 30 형식의 순수 숫자",
          "isPatternGauge": 무늬게이지여부(true/false),
          "type": "의류 종류",
          "yarn": "원작 실 이름",
          "yarnComponent": "도안에서 찾아낸 실의 성분 정보",
          "note": "바늘 정보 및 핵심 특이사항"
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
