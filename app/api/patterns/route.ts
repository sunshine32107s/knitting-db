import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prisma가 서버리스 환경에서 중복 생성되는 것을 방지하는 안전 코드
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 1. DB에서 전체 도안 목록 불러오기 (최신순)
export async function GET() {
  try {
    const patterns = await prisma.pattern.findMany({
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(patterns);
  } catch (error) {
    return NextResponse.json({ error: '불러오기 실패' }, { status: 500 });
  }
}

// 2. DB에 새 도안 저장하기
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPattern = await prisma.pattern.create({
      data: {
        name: body.name,
        gauge: body.gauge,
        type: body.type,
        yarn: body.yarn,
        yarnComponent: body.yarnComponent,
        note: body.note,
        imageUrl: body.imageUrl || null,
      },
    });
    return NextResponse.json(newPattern);
  } catch (error) {
    return NextResponse.json({ error: '저장 실패' }, { status: 500 });
  }
}

// 3. DB에 저장된 도안 수정하기
export async function PUT(request: Request) {
  try {
    const { id, field, value } = await request.json();
    const updatedPattern = await prisma.pattern.update({
      where: { id: Number(id) },
      data: { [field]: value },
    });
    return NextResponse.json(updatedPattern);
  } catch (error) {
    return NextResponse.json({ error: '수정 실패' }, { status: 500 });
  }
}

// 4. DB에서 도안 삭제하기
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID 누락' }, { status: 400 });

    await prisma.pattern.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
