import { useState, useEffect } from 'react';

interface WheelComponentProps {
  wheelResult?: number;
  arrowPosition?: number;
  isLeader: boolean;
  canSeeWheel: boolean;
  onMoveArrow: (position: number) => void;
}

const WheelComponent = ({ 
  arrowPosition, 
  isLeader, 
  canSeeWheel,
  onMoveArrow 
}: WheelComponentProps) => {
  const [localArrowPosition, setLocalArrowPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (arrowPosition !== undefined) {
      setLocalArrowPosition(arrowPosition);
    }
  }, [arrowPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLeader) return; // Ведущий не может двигать стрелку
    
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isLeader) return;

    const wheel = e.currentTarget as HTMLElement;
    const rect = wheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.bottom; // Нижняя часть колеса (центр полукруга)

    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let degrees = (angle * 180) / Math.PI + 90; // +90 для поправки

    // Ограничиваем угол от 0 до 180 (полукруг)
    if (degrees < 0) degrees = 0;
    if (degrees > 180) degrees = 180;

    setLocalArrowPosition(degrees);
    onMoveArrow(degrees);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const wheelStyle = canSeeWheel 
    ? {
        background: `conic-gradient(
          from 0deg,
          #F59E0B 0deg 60deg,
          #EF4444 60deg 120deg,
          #3B82F6 120deg 240deg,
          #EF4444 240deg 300deg,
          #F59E0B 300deg 360deg
        )`
      }
    : { background: '#1F2937' };

  return (
    <div 
      className={`wheel ${!canSeeWheel ? 'wheel-hidden' : ''}`}
      style={wheelStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {/* Секторы с цифрами (видны только ведущему) */}
      {canSeeWheel && (
        <>
          <div 
            style={{
              position: 'absolute',
              left: '15%',
              top: '70%',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            2
          </div>
          <div 
            style={{
              position: 'absolute',
              left: '35%',
              top: '30%',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            3
          </div>
          <div 
            style={{
              position: 'absolute',
              left: '50%',
              top: '20%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            4
          </div>
          <div 
            style={{
              position: 'absolute',
              right: '35%',
              top: '30%',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            3
          </div>
          <div 
            style={{
              position: 'absolute',
              right: '15%',
              top: '70%',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            2
          </div>
        </>
      )}
      
      {/* Стрелка */}
      <div 
        className="wheel-arrow"
        style={{
          transform: `translateX(-50%) rotate(${localArrowPosition - 90}deg)`,
          cursor: isLeader ? 'not-allowed' : 'grab'
        }}
      />
    </div>
  );
};

export default WheelComponent;
