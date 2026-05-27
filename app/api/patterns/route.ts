import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 서버리스 환경 최적화 인스턴스 생성
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 1. 전체 도안 불러오기
export async function GET() {
  try {
    // 테이블이 비어있으면 빈 배열([])을 반환하도록 유연하게 처리
    const patterns = await prisma.pattern.findMany({
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(patterns);
  } catch (error: any) {
    console.error('🛑 [DB 불러오기 에러]:', error.message || error);
    return NextResponse.json({ error: '불러오기 실패', details: error.message }, { status: 500 });
  }
}

// 2. 새 도안 저장하기
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPattern = await prisma.pattern.create({
      data: {
        name: body.name || '새 도안 항목',
        gauge: body.gauge || '',
        type: body.type || '',
        yarn: body.yarn || '',
        yarnComponent: body.yarnComponent || '',
        note: body.note || '',
        imageUrl: body.imageUrl || null,
      },
    });
    return NextResponse.json(newPattern);
  } catch (error: any) {
    console.error('🛑 [DB 저장하기 에러]:', error.message || error);
    return NextResponse.json({ error: '저장 실패', details: error.message }, { status: 500 });
  }
}

// 3. 도안 수정하기
export async function PUT(request: Request) {
  try {
    const { id, field, value } = await request.json();
    const updatedPattern = await prisma.pattern.update({
      where: { id: Number(id) },
      data: { [field]: value },
    });
    return NextResponse.json(updatedPattern);
  } catch (error: any) {
    console.error('🛑 [DB 수정하기 에러]:', error.message || error);
    return NextResponse.json({ error: '수정 실패', details: error.message }, { status: 500 });
  }
}

// 4. 도안 삭제하기
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID 누락' }, { status: 400 });

    await prisma.pattern.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('🛑 [DB 삭제하기 에러]:', error.message || error);
    return NextResponse.json({ error: '삭제 실패', details: error.message }, { status: 500 });
  }
}
