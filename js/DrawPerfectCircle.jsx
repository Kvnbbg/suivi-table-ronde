import React, { useState, useRef, useEffect } from 'react';

export default function DrawPerfectCircle() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const pointsRef = useRef([]);
  const scaleRef = useRef(1);
  const rafRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [result, setResult] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [bestScore, setBestScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const scheduleDraw = () => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      drawCanvas();
    });
  };

  const evaluateCircle = (points) => {
    if (points.length < 10) {
      return { score: 0, message: 'Draw a complete circle!' };
    }

    const center = points.reduce(
      (acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
      }),
      { x: 0, y: 0 }
    );

    center.x /= points.length;
    center.y /= points.length;

    let avgRadius = 0;
    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
      );
      avgRadius += distance;
    }
    avgRadius /= points.length;

    let radiusVariance = 0;
    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
      );
      radiusVariance += Math.pow(distance - avgRadius, 2);
    }
    radiusVariance = Math.sqrt(radiusVariance / points.length);

    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const closureDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
    );
    const maxClosureDistance = avgRadius * 0.2;
    const isClosed = closureDistance < maxClosureDistance;

    const maxVariance = avgRadius * 0.5;
    const varianceScore = Math.max(0, 1 - radiusVariance / maxVariance);
    const closureScore = isClosed ? 1 : 0.5;

    let totalScore = Math.round(
      (varianceScore * 0.6 + closureScore * 0.4) * 100
    );
    totalScore = Math.max(0, Math.min(100, totalScore));

    let message;
    if (totalScore >= 95) {
      message = "Perfect circle! You're a true artist! ✨";
    } else if (totalScore >= 85) {
      message = 'Excellent! Almost perfect! 🎯';
    } else if (totalScore >= 75) {
      message = 'Great job! Very circular! 👏';
    } else if (totalScore >= 60) {
      message = 'Good effort! Keep practicing! 💪';
    } else if (totalScore >= 40) {
      message = 'Not bad! Try drawing slower? 🖊️';
    } else if (totalScore >= 20) {
      message = 'Give it another shot! Practice makes perfect! 🔄';
    } else {
      message = 'Hmm, that looks more like abstract art! 🎨';
    }

    return { score: totalScore, message, isClosed };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const resizeCanvas = () => {
      const scale = window.devicePixelRatio || 1;
      scaleRef.current = scale;
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [showGrid, result, bestScore, attempts]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const scale = scaleRef.current || 1;
    const displayWidth = canvas.width / scale;
    const displayHeight = canvas.height / scale;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    if (showGrid) {
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      const gridSize = 40;

      for (let x = 0; x < displayWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, displayHeight);
        ctx.stroke();
      }

      for (let y = 0; y < displayHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
        ctx.stroke();
      }
    }

    const points = pointsRef.current;
    if (points.length > 1) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.stroke();
    }

    if (result) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const scoreText = `${result.score}/100`;
      ctx.fillText(scoreText, displayWidth / 2, displayHeight / 2 - 50);

      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillText(result.message, displayWidth / 2, displayHeight / 2 + 30);

      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        `Best score: ${bestScore} | Attempts: ${attempts}`,
        displayWidth / 2,
        displayHeight / 2 + 70
      );
    }
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getTouchPos = (e) => {
    if (e.touches.length === 0) return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  };

  const startDrawing = (pos) => {
    if (!pos) return;
    setIsDrawing(true);
    setHasDrawing(true);
    pointsRef.current = [pos];
    setResult(null);
    scheduleDraw();
  };

  const draw = (pos) => {
    if (!pos || !isDrawing || result) return;
    pointsRef.current.push(pos);
    scheduleDraw();
  };

  const stopDrawing = () => {
    if (!isDrawing || result) return;
    setIsDrawing(false);

    const evaluation = evaluateCircle(pointsRef.current);
    setResult(evaluation);
    setAttempts((prev) => prev + 1);
    setBestScore((prev) => Math.max(prev, evaluation.score));
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    startDrawing(getMousePos(e));
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    draw(getMousePos(e));
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    startDrawing(getTouchPos(e));
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    draw(getTouchPos(e));
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearCanvas = () => {
    pointsRef.current = [];
    setHasDrawing(false);
    setResult(null);
    scheduleDraw();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <div className="absolute top-4 left-4 flex gap-2">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          {showGrid ? 'Hide grid' : 'Show grid'}
        </button>
      </div>

      {!hasDrawing && !result && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <h1 className="text-4xl font-bold mb-4">Draw a perfect circle</h1>
          <p className="text-gray-600 text-lg">
            Click and drag to draw your circle
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Best score: {bestScore} | Attempts: {attempts}
          </p>
        </div>
      )}

      {result && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={clearCanvas}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
