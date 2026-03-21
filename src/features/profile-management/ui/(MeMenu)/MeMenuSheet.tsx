'use client';

import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/src/shared/ui/sheet';
import { LogoutButton } from '@/src/features/auth/ui/LogoutButton';
import { FeedbackSheet } from './FeedbackSheet';
import AppSheetHeader from '@/src/shared/ui/AppSheetHeader';

const MENU_SECTIONS = [
  {
    id: 'support',
    title: '정보 및 지원',
    items: [
      { id: 'cs', content: <FeedbackSheet /> },
      // 향후 약관, 공지사항 등 추가 가능
    ],
  },
  {
    id: 'account',
    title: '계정 정보',
    items: [{ id: 'logout', content: <LogoutButton variant="text" /> }],
  },
];

/**
 * 마이페이지 전용 메뉴 시트 컴포넌트입니다.
 * 로그아웃, 고객센터 설정을 포함합니다.
 */
export const MeMenuSheet = () => {
  return (
    <Sheet>
      <SheetTrigger className="transition-transform outline-none active:scale-95">
        <Menu className="size-6 text-neutral-900" />
      </SheetTrigger>
      <SheetContent
        showCloseButton={false}
        side="right"
        className="flex flex-col gap-0 border-none p-0"
      >
        <AppSheetHeader title="설정" />

        <div className="flex flex-1 flex-col overflow-y-auto">
          {MENU_SECTIONS.map((section) => (
            <div key={section.id} className="flex flex-col">
              <section className="flex flex-col p-4">
                <h3 className="px-2 py-2 text-left text-[11px] font-bold tracking-wider text-neutral-700 uppercase">
                  {section.title}
                </h3>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <div key={item.id}>{item.content}</div>
                  ))}
                </div>
              </section>
              {/* 섹션 구분선 */}
              <div className="h-[3px] w-full bg-neutral-100" />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
