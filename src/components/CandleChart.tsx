import React, { useEffect, useState, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const CandleChart = () => {
    const [data, setData] = useState<any>(null);
    const [countdown, setCountdown] = useState<number>(3);
    const [isRunning, setIsRunning] = useState<boolean>(true);
    const [isGeneratingCandles, setIsGeneratingCandles] = useState<boolean>(false);
    const [currentCandleIndex, setCurrentCandleIndex] = useState<number>(0);
    const [candleData, setCandleData] = useState<any[]>([]);
    const completedCandlesRef = useRef<any[]>(new Array(30).fill(null));
    const animationFrameId = useRef<number | undefined>(undefined);
    const lastUpdateTime = useRef<number>(Date.now());
    const candleStartTime = useRef<number>(0);
    const currentIndexRef = useRef(0);

    const animationState = useRef({
        startValue: 0,
        targetValue: 0,
        currentValue: 0,
        base: 1
    });

    const createChartData = (candles: any[]) => {
        const visibleCandles = new Array(30).fill(null);
        
        // Place completed candles
        completedCandlesRef.current.forEach((candle, index) => {
            if (candle) {
                visibleCandles[index] = candle;
            }
        });

        // Place current animating candle
        if (candles[currentIndexRef.current]) {
            visibleCandles[currentIndexRef.current] = candles[currentIndexRef.current];
        }

        return {
            labels: Array.from({ length: 30 }, (_, i) => i.toString()),
            datasets: [{
                data: visibleCandles.map((candle) => {
                    if (!candle) return null;
                    return [candle.base, candle.value];
                }),
                backgroundColor: visibleCandles.map((candle) => {
                    if (!candle) return 'transparent';
                    return candle.value >= candle.base ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)';
                }),
                borderColor: visibleCandles.map((candle) => {
                    if (!candle) return 'transparent';
                    return candle.value >= candle.base ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)';
                }),
                borderWidth: 1,
                base: visibleCandles.map((candle) => candle?.base || null),
                barPercentage: 0.8,
                categoryPercentage: 0.8,
                barThickness: 20,
                // skipNull: true  // Add this line
            }]
        };
    };

    const resetChart = () => {
        setIsGeneratingCandles(false);
        currentIndexRef.current = 0;
        setCurrentCandleIndex(0);
        completedCandlesRef.current = new Array(30).fill(null);
        setCandleData([]);
        setData(createChartData([]));
        setCountdown(3);
        setIsRunning(true);
        animationState.current = {
            startValue: 0,
            targetValue: 0,
            currentValue: 0,
            base: 1
        };
        lastUpdateTime.current = Date.now();
    };

    const startNewCandle = () => {
        const prevValue = currentIndexRef.current === 0 
            ? 1  // Only the first candle starts at 1
            : animationState.current.targetValue; // Use the previous candle's target as new base
        
        const targetValue = Math.random() * 5;
        console.log(`Starting new candle at position ${currentIndexRef.current} with base ${prevValue} and target ${targetValue}`);
        
        animationState.current = {
            startValue: prevValue,
            targetValue: targetValue,
            currentValue: prevValue,
            base: prevValue
        };
        candleStartTime.current = Date.now();
    };

    const animateCandle = () => {
        if (!isGeneratingCandles) return;

        const currentTime = Date.now();
        const elapsedTime = currentTime - candleStartTime.current;
        const duration = 5000;

        if (elapsedTime >= duration) {
            const currentIndex = currentIndexRef.current;
            
            completedCandlesRef.current[currentIndex] = {
                value: animationState.current.targetValue,
                position: currentIndex,
                base: animationState.current.base
            };
            
            console.log('Completed candles:', completedCandlesRef.current.filter(c => c !== null));

            setCandleData([]);
            setData(createChartData([]));

            if (currentIndex < 29) {
                const nextIndex = currentIndex + 1;
                console.log(`Moving to next candle position: ${nextIndex}`);
                currentIndexRef.current = nextIndex;
                setCurrentCandleIndex(nextIndex);
                startNewCandle();
            } else {
                console.log('Reached end of chart');
                setIsGeneratingCandles(false);
                setTimeout(resetChart, 1000);
            }
        } else {
            const progress = elapsedTime / duration;
            const { startValue, targetValue, base } = animationState.current;
            
            const noise = Math.sin(progress * Math.PI * 8) * 0.05;
            const currentValue = startValue + (targetValue - startValue) * progress + noise;
            
            animationState.current.currentValue = currentValue;

            const newCandleData = [];
            newCandleData[currentIndexRef.current] = {
                value: currentValue,
                position: currentIndexRef.current,
                base: base
            };
            
            setCandleData(newCandleData);
            setData(createChartData(newCandleData));
        }

        animationFrameId.current = requestAnimationFrame(animateCandle);
    };

    useEffect(() => {
        resetChart();
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isRunning) return;

        const updateCountdown = () => {
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastUpdateTime.current) / 1000;
            lastUpdateTime.current = currentTime;

            setCountdown((prev) => {
                const newCountdown = prev - deltaTime;
                if (newCountdown <= 0) {
                    setIsRunning(false);
                    setIsGeneratingCandles(true);
                    return 0;
                }
                return newCountdown;
            });

            if (countdown > 0) {
                requestAnimationFrame(updateCountdown);
            }
        };

        const animationId = requestAnimationFrame(updateCountdown);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [isRunning, countdown]);

    useEffect(() => {
        if (isGeneratingCandles) {
            startNewCandle();
            animateCandle();
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isGeneratingCandles]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        scales: {
            y: {
                position: 'left',
                // beginAtZero: true,  // Add this line
                ticks: {
                    callback: (value: number) => `${value.toFixed(1)}x`,
                    color: 'white',
                    font: { size: 14 }
                },
                min: 0,
                max: 5,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            x: {
                display: false,
                grid: {
                    display: false
                },
                offset: true,
                ticks: {
                    display: false
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: false
            }
        }
    };

    return (
        <div style={{ 
            position: 'relative', 
            height: '400px', 
            width: '100%',
            backgroundColor: '#13141b',
            borderRadius: '8px',
            padding: '20px'
        }}>
            {data && <Bar data={data} options={options as any} />}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '5px 10px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold'
            }}>
                {countdown.toFixed(1)}s
            </div>
        </div>
    );
};

export default CandleChart;