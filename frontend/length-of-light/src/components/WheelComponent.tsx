import { useState, useEffect } from 'react';
import type { WheelSector } from '../types/game';

interface WheelComponentProps {
  wheelResult?: number;
  wheelSectors?: WheelSector[];
  arrowPosition?: number;
  canSeeWheel: boolean; // может ли видеть сектора
  canControl: boolean; // может ли управлять стрелкой (не ведущий, но в активной команде)
  onMoveArrow: (position: number) => void;
}

const WheelComponent = ({ 
  arrowPosition, 
  wheelSectors,
  canSeeWheel,
  canControl,
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
    if (!canControl) return; // Только разрешённые игроки
    
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canControl) return;

    const wheel = e.currentTarget as HTMLElement;
    const rect = wheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.bottom; // Нижняя часть колеса (центр полукруга)

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    
    // Вычисляем угол от центра полукруга
    let angle = Math.atan2(-deltaY, deltaX) * (180 / Math.PI);
    
    // Нормализуем угол к диапазону 0-180 для полукруга
    if (angle < 0) angle += 180;
    if (angle > 180) angle = 180;

    setLocalArrowPosition(angle);
    onMoveArrow(angle);
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

  // Функция для создания CSS градиента на основе секторов
  const createWheelGradient = (sectors: WheelSector[]) => {
    if (!sectors || sectors.length === 0) return '#1F2937';
    
    let gradientStops = [];
    
    // Создаем градиент только для секторов, остальная часть серая
    gradientStops.push(`#1F2937 0deg`);
    
    for (const sector of sectors) {
      const color = sector.color === 'yellow' ? '#F59E0B' : 
                   sector.color === 'red' ? '#EF4444' : '#3B82F6';
      gradientStops.push(`#1F2937 ${sector.startAngle}deg`);
      gradientStops.push(`${color} ${sector.startAngle}deg`);
      gradientStops.push(`${color} ${sector.endAngle}deg`);
      gradientStops.push(`#1F2937 ${sector.endAngle}deg`);
    }
    
    gradientStops.push(`#1F2937 180deg`);
    
    return `conic-gradient(from 0deg at 50% 100%, ${gradientStops.join(', ')})`;
  };

  const wheelStyle = canSeeWheel && wheelSectors
    ? {
        background: createWheelGradient(wheelSectors),
        border: '3px solid white',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
      }
    : { 
        background: '#1F2937',
        border: '3px solid white',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
      };

  return (
    <div 
      className={`wheel ${!canSeeWheel ? 'wheel-hidden' : ''}`}
      style={wheelStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {/* Разделительные линии и цифры секторов */}
      {canSeeWheel && wheelSectors && wheelSectors.map((sector, index) => {
        const centerAngle = (sector.startAngle + sector.endAngle) / 2;
        const radians = (centerAngle * Math.PI) / 180;
        
        // Позиция для цифры (80% от радиуса)
        const textRadius = 120;
        const textX = 50 + (textRadius * Math.cos(radians)) / 3; // Масштабируем к процентам
        const textY = 100 - (textRadius * Math.sin(radians)) / 1.5; // Масштабируем к процентам
        
        return (
          <div key={index}>
            {/* Разделительная линия в начале сектора */}
            <div 
              style={{
                position: 'absolute',
                bottom: '0',
                left: '50%',
                width: '2px',
                height: '150px',
                background: 'white',
                transformOrigin: 'bottom',
                transform: `translateX(-50%) rotate(${sector.startAngle}deg)`,
                zIndex: 5
              }}
            />
            
            {/* Цифра в центре сектора */}
            <div 
              style={{
                position: 'absolute',
                left: `${textX}%`,
                top: `${textY}%`,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.5rem',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                zIndex: 10,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {sector.value}
            </div>
          </div>
        );
      })}
      
      {/* Конечная разделительная линия */}
      {canSeeWheel && wheelSectors && wheelSectors.length > 0 && (
        <div 
          style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            width: '2px',
            height: '150px',
            background: 'white',
            transformOrigin: 'bottom',
            transform: `translateX(-50%) rotate(${wheelSectors[wheelSectors.length - 1].endAngle}deg)`,
            zIndex: 5
          }}
        />
      )}
      
      {/* Стрелка */}
      <div 
        className="wheel-arrow"
        style={{
          transform: `translateX(-50%) rotate(${localArrowPosition}deg)`,
      cursor: canControl ? 'grab' : 'not-allowed'
        }}
      />
    </div>
  );
};

export default WheelComponent;
