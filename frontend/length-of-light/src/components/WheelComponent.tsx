import {useState, useEffect, useRef} from 'react';
import type {WheelSector} from '../types/game';
import Wheel from "../models/Wheel.ts";

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
    const [isDragging, setIsDragging] = useState(false);
    const canvasRef = useRef(null);
    const wheelModel = useRef(null);
    useEffect(() => {
        wheelModel.current = new Wheel(canvasRef.current);

    }, []);
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

        if (angle > 180 || angle < 0) {
            return;
        }

        onMoveArrow(angle);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="wheel-container">
            <canvas onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}
                    ref={canvasRef}></canvas>
        </div>
    );
};

export default WheelComponent;
