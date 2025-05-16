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
    const [rugPulled, setRugPulled] = useState(false);

    const completedCandlesRef = useRef<any[]>(new Array(30).fill(null));
    const animationFrameId = useRef<number | undefined>(undefined);
    const lastUpdateTime = useRef<number>(Date.now());
    const candleStartTime = useRef<number>(0);
    const currentIndexRef = useRef(0);
    const yAxisMin = useRef<number>(0.5);
    const yAxisMax = useRef<number>(1.5);
    const MAX_DURATION_MS = 30 * 1000; // 30 seconds for testing
    const rugPullTimeoutRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

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
            }]
        };
    };

    const executeRugPull = () => {
        setRugPulled(true);
        
        // Force current candle to zero
        const currentValue = animationState.current.currentValue;
        animationState.current = {
            ...animationState.current,
            targetValue: 0,
            startValue: currentValue
        };
        
        // Reset candleStartTime to create a quick animation to zero
        candleStartTime.current = Date.now();
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
        setRugPulled(false);
        animationState.current = {
            startValue: 0,
            targetValue: 0,
            currentValue: 0,
            base: 1
        };
        yAxisMin.current = 0.5;
        yAxisMax.current = 1.5;
        lastUpdateTime.current = Date.now();

        // Clear any existing rug pull timeout
        if (rugPullTimeoutRef.current) {
            clearTimeout(rugPullTimeoutRef.current);
        }
    };

    const updateAxisBounds = (newValue: number) => {
        if (newValue > yAxisMax.current) {
            yAxisMax.current = Math.ceil(newValue * 2) / 2;
        }
        if (newValue < yAxisMin.current) {
            yAxisMin.current = Math.floor(newValue * 2) / 2;
        }
    };

    const startNewCandle = () => {
        const currentTime = Date.now();
        if (currentTime - startTimeRef.current >= MAX_DURATION_MS) {
            setIsGeneratingCandles(false);
            setTimeout(resetChart, 1000);
            return;
        }

        const prevValue = currentIndexRef.current === 0 
            ? 1  // Only the first candle starts at 1
            : animationState.current.targetValue;

        const maxChange = 5;
        const absoluteMax = 100;
        const minPossibleTarget = Math.max(prevValue - maxChange, 0);
        const maxPossibleTarget = Math.min(prevValue + maxChange, absoluteMax);
        
        const targetValue = minPossibleTarget + (Math.random() * (maxPossibleTarget - minPossibleTarget));
        
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
        const duration = rugPulled ? 1000 : 3000; // Faster animation during rug pull

        if (elapsedTime >= duration) {
            if (rugPulled) {
                setIsGeneratingCandles(false);
                setTimeout(resetChart, 1000);
                return;
            }

            const currentIndex = currentIndexRef.current;
            const finalValue = animationState.current.targetValue;
            
            updateAxisBounds(finalValue);
            
            completedCandlesRef.current[currentIndex] = {
                value: finalValue,
                position: currentIndex,
                base: animationState.current.base
            };

            setCandleData([]);
            setData(createChartData([]));

            if (currentIndex < 29) {
                const nextIndex = currentIndex + 1;
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
            
            const noise = rugPulled ? 0 : Math.sin(progress * Math.PI * 8) * 0.05;
            const currentValue = startValue + (targetValue - startValue) * progress + noise;
            
            updateAxisBounds(currentValue);
            
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
            startTimeRef.current = Date.now();
            startNewCandle();
            animateCandle();

            // Set up random rug pull timer
            const rugPullDelay = Math.random() * MAX_DURATION_MS;
            rugPullTimeoutRef.current = setTimeout(executeRugPull, rugPullDelay);

            // Set up max duration timer
            const maxDurationTimeout = setTimeout(() => {
                setIsGeneratingCandles(false);
                setTimeout(resetChart, 1000);
            }, MAX_DURATION_MS);

            return () => {
                if (rugPullTimeoutRef.current) {
                    clearTimeout(rugPullTimeoutRef.current);
                }
                clearTimeout(maxDurationTimeout);
                if (animationFrameId.current) {
                    cancelAnimationFrame(animationFrameId.current);
                }
            };
        }
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
                ticks: {
                    callback: (value: number) => `${value.toFixed(1)}x`,
                    color: 'white',
                    font: { size: 14 }
                },
                min: yAxisMin.current,
                max: yAxisMax.current,
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
            {rugPulled && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: '20px',
                    backgroundColor: 'rgba(255, 0, 0, 0.9)',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                }}>
                    RUG PULLED!
                </div>
            )}
        </div>
    );
};

export default CandleChart;