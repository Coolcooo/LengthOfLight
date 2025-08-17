
function getRadFromDegree(degree: number) {
    return degree * (Math.PI / 180);
}
class Wheel {
    canvas: HTMLCanvasElement;
    wheelSectors: WheelSectors;
    hidden = true;
    arrow: Arrow;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.wheelSectors = new WheelSectors(this.canvas);
        this.arrow = new Arrow(this.canvas);
    }
    draw() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        const radius = Math.min(canvasWidth / 2, canvasHeight);
        ctx.arc(canvasWidth / 2, canvasHeight, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgb(13, 16, 49)";
        if (this.hidden) {
            ctx.fillStyle = "rgb(92, 195, 235)";
            ctx.stroke();
            ctx.fill();
            this.arrow.draw();
        } else {
            ctx.fillStyle = "rgb(244, 238, 226)";
            ctx.stroke();
            ctx.fill();
            this.wheelSectors.draw();
        }

    }
    getNewWheelPosition() {
        const randomDegree = Math.round(-20 + Math.random() * 170);
        return getRadFromDegree(randomDegree/* - Math.floor(randomDegree / 360) * 360*/);
    }
    calculateNewWheelPosition() {
        this.wheelSectors.setAngle(this.getNewWheelPosition());
        this.wheelSectors.recalculate();
    }
    getPoints() {

    }
}

class WheelSectors {
    sectors: WheelSectorBase[];
    angle = 0;
    canvas: HTMLCanvasElement
    constructor(canvas: HTMLCanvasElement) {
        this.sectors = [
            new WheelSector2(canvas),
            new WheelSector3(canvas),
            new WheelSector4(canvas),
            new WheelSector3(canvas),
            new WheelSector2(canvas)
        ];
        this.canvas = canvas;
    }
    draw() {
        for (let i = 0; i < this.sectors.length; i += 1) {
            this.sectors[i].draw();
        }
    }
    setAngle(angle: number) {
        this.angle = angle;
    }
    recalculate() {
        let startSectorAngle = this.angle;
        for (let i = 0; i < this.sectors.length; i += 1) {
            const wheelSector = this.sectors[i];
            wheelSector.setAngle(this.angle + startSectorAngle);
            startSectorAngle +=  this.sectors[i].deltaAngle;
        }
    }
}
class WheelSectorBase {
    angle = 0;
    deltaAngle = getRadFromDegree(10);
    text = "";
    color = "rgb(0, 0, 0)";
    canvas: HTMLCanvasElement;
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }
    setAngle(angle: number) {
        this.angle = angle;
    }
    draw() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const radius = Math.min(width / 2, height);
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            ctx.fillStyle = this.color;
            ctx.arc(width / 2, height, radius, this.angle, this.angle + this.deltaAngle);
            ctx.fill();
        }
    }
}
class WheelSector2 extends WheelSectorBase {
    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.text = "2";
        this.color = "rgb(237, 168, 39)";
    }
}
class WheelSector3 extends WheelSectorBase {
    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.text = "3";
        this.color = "rgb(239, 71, 60)";
    }
}
class WheelSector4 extends WheelSectorBase {
    constructor(canvas:HTMLCanvasElement) {
        super(canvas);
        this.text = "4";
        this.color = "rgb(87, 132, 153)";
    }
}
class Arrow {
    angle = 0;
    color = "rgb(145, 0, 17)";
    canvas: HTMLCanvasElement;
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }
    setAngle(angle: number) {
        this.angle = angle;
    }
    draw() {
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            const width = this.canvas.width;
            const height = this.canvas.height;
            ctx.save();
            ctx.translate(width / 2, height);
            const radius = Math.min(height, width / 2);
            const arcRadius = radius * 0.1;
            ctx.fillStyle = this.color;
            ctx.arc(0, 0, arcRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.moveTo(-arcRadius * 0.2, 0);
            ctx.lineTo(0, radius * 0.8);
            ctx.lineTo(arcRadius * 0.2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}

export default Wheel;