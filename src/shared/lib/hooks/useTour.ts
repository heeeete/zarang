import { useEffect } from 'react'
import { driver, Config } from 'driver.js'
import 'driver.js/dist/driver.css'

// 가이드 버전 상수 (내용이 변경될 때 v2, v3...로 올리면 사용자에게 다시 노출됩니다.)
export const TOUR_VERSION = 'v1'

interface UseTourProps {
  key: string // localStorage 키 (예: 'home')
  steps: Config['steps']
  shouldStart?: boolean // 가이드를 시작할 추가 조건
  isAuthenticated?: boolean // 로그인 여부 (true일 때만 실행)
}

/**
 * 사용자 가이드(Tour)를 관리하는 공통 훅입니다.
 */
export const useTour = ({ 
  key, 
  steps, 
  shouldStart = true,
  isAuthenticated = false 
}: UseTourProps) => {
  useEffect(() => {
    // 1. 로그인하지 않은 유저는 가이드를 보지 않습니다.
    if (!isAuthenticated) return

    // 2. 버전이 포함된 최종 키 생성 (예: 'tour:home:v1')
    const tourKey = `tour:${key}:${TOUR_VERSION}`
    
    // 3. 이미 가이드를 본 적이 있는지 로컬스토리지 확인
    const hasSeenTour = localStorage.getItem(tourKey)
    
    if (hasSeenTour || !shouldStart || !steps || steps.length === 0) return

    // 4. 가이드(Driver.js) 설정
    const driverObj = driver({
      showProgress: true,
      steps,
      // 가이드가 종료되거나 중간에 닫힐 때 실행
      onDestroyStarted: () => {
        // 가이드를 본 것으로 기록
        localStorage.setItem(tourKey, 'true')
        driverObj.destroy()
      },
      nextBtnText: '다음',
      prevBtnText: '이전',
      doneBtnText: '완료',
    })

    // 5. 가이드 시작
    const timer = setTimeout(() => {
      driverObj.drive()
    }, 500)

    return () => {
      clearTimeout(timer)
      driverObj.destroy()
    }
  }, [key, steps, shouldStart, isAuthenticated])
}
