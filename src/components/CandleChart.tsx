import React, { useEffect, useState, useRef } from 'react';
import './CandleChart.css';

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
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    annotationPlugin
);

const CandleChart = () => {
    const [data, setData] = useState<any>(null);
    const [countdown, setCountdown] = useState<number>(3);
    const [isRunning, setIsRunning] = useState<boolean>(true);
    const [isGeneratingCandles, setIsGeneratingCandles] = useState<boolean>(false);
    const [currentCandleIndex, setCurrentCandleIndex] = useState<number>(0);
    const [candleData, setCandleData] = useState<any[]>([]);
    const [rugPulled, setRugPulled] = useState(false);
    const [isShowingRugPullMessage, setIsShowingRugPullMessage] = useState(false);
    const [shakingChart, setShakingChart] = useState(false);

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

    const countdownRef = useRef<number>(3);

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
        // Stop all ongoing animations and timers
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = undefined;
        }
        
        setShakingChart(true);
        setTimeout(() => setShakingChart(false), 1000);
        setIsRunning(false);
        setIsGeneratingCandles(false);
        setRugPulled(true);
        setIsShowingRugPullMessage(true);

        
        // Force current candle to instantly go to zero
        const currentValue = animationState.current.base;
        animationState.current = {
            ...animationState.current,
            targetValue: 0,
            startValue: currentValue,
            currentValue: 0
        };
        
        yAxisMin.current = 0;
        // Update the completed candles array with the rug pull candle
        completedCandlesRef.current[currentIndexRef.current] = {
            value: 0,
            position: currentIndexRef.current,
            base: currentValue
        };
        
        // Update the chart immediately
        setCandleData([]);
        setData(createChartData([]));
    };

    const resetChart = () => {
        console.log("Resetting chart - Initial countdown value:", countdown);
        
        // Clear any existing timeouts first
        if (rugPullTimeoutRef.current) {
            clearTimeout(rugPullTimeoutRef.current);
            rugPullTimeoutRef.current = null;
        }
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = undefined;
        }

        // Reset all refs
        currentIndexRef.current = 0;
        startTimeRef.current = 0;
        candleStartTime.current = 0;
        lastUpdateTime.current = Date.now();
        completedCandlesRef.current = new Array(30).fill(null);
        
        animationState.current = {
            startValue: 0,
            targetValue: 0,
            currentValue: 0,
            base: 1
        };
        
        yAxisMin.current = 0.5;
        yAxisMax.current = 1.5;

        // Reset countdown ref first
        countdownRef.current = 3;
        
        // Reset all states
        setIsShowingRugPullMessage(false);
        setIsGeneratingCandles(false);
        setRugPulled(false);
        setCandleData([]);
        setData(createChartData([]));
        setCurrentCandleIndex(0);
        setCountdown(3);
        
        console.log("After setting countdown to 3 in resetChart");
        
        // Start the countdown after a brief delay
        setTimeout(() => {
            console.log("Starting new round with countdown:", countdownRef.current);
            setIsRunning(true);
        }, 100);
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
        if (!isGeneratingCandles || rugPulled) return;

        const currentTime = Date.now();
        const elapsedTime = currentTime - candleStartTime.current;
        const duration = 3000;

        if (elapsedTime >= duration) {
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

    // Add dynamic background based on chart performance
    const getBackgroundGradient = () => {
        const currentValue = animationState.current.currentValue;
        const startValue = animationState.current.startValue;
        
        if (rugPulled) {
            return 'linear-gradient(to bottom, #13141b, #3d0000)';
        }
        
        if (currentValue > startValue) {
            return 'linear-gradient(to bottom, #13141b, #003d00)';
        }
        
        return 'linear-gradient(to bottom, #13141b, #13141b)';
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
        
        console.log("Countdown started with value:", countdownRef.current);
        lastUpdateTime.current = Date.now();

        const updateCountdown = () => {
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastUpdateTime.current) / 1000;
            lastUpdateTime.current = currentTime;

            setCountdown((prev) => {
                const newCountdown = prev - deltaTime;
                // Update the ref as well
                countdownRef.current = newCountdown;
                if (newCountdown <= 0) {
                    requestAnimationFrame(() => {
                        setIsRunning(false);
                        setCountdown(0);
                        countdownRef.current = 0;
                        setIsGeneratingCandles(true);
                    });
                    return 0;
                }
                return newCountdown;
            });

            if (countdownRef.current > 0) {
                requestAnimationFrame(updateCountdown);
            }
        };

        const animationId = requestAnimationFrame(updateCountdown);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [isRunning]);

    useEffect(() => {
        if (countdown === 0 && !isGeneratingCandles && !rugPulled) {
            setIsGeneratingCandles(true);
        }
    }, [countdown, rugPulled]);

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
                if (rugPullTimeoutRef.current) clearTimeout(rugPullTimeoutRef.current);
                clearTimeout(maxDurationTimeout);
                if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            };
        }
    }, [isGeneratingCandles]);

    useEffect(() => {
        if (isShowingRugPullMessage) {
            const timer = setTimeout(() => {
                setIsShowingRugPullMessage(false);
                lastUpdateTime.current = Date.now();
                resetChart();
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [isShowingRugPullMessage]);

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
                    color: '#e6e6e6', // Off-white
                    font: {
                        size: 11,
                        family: "'Orbitron', sans-serif",
                        weight: 'bold'
                    },
                },
                min: yAxisMin.current,
                max: yAxisMax.current,
                grid: {
                    color: 'rgba(230, 230, 230, 0.1)', // Very subtle off-white for grid lines
                    lineWidth: 1,
                    borderDash: [5, 5] // Creates a dashed line effect
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
            },
            annotation: {
                annotations: {
                    line1: {
                        type: 'line',
                        yMin: animationState.current.currentValue,
                        yMax: animationState.current.currentValue,
                        borderColor: '#e6e6e6',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        label: {
                            display: true,
                            content: `${animationState.current.currentValue.toFixed(4)}x`,
                            position: 'end',
                            backgroundColor: 'rgba(0, 0, 0, 0.85)',
                            color: '#ffffff',
                            font: {
                                family: "'Orbitron', sans-serif",
                                size: 14,
                                weight: 'bold'
                            },
                            padding: {
                                top: 6,
                                bottom: 6,
                                left: 10,
                                right: 10
                            },
                            borderRadius: 4,
                            textAlign: 'center'
                        }
                    }
                }
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
            padding: '20px',
            animation: shakingChart ? 'shake 0.5s infinite' : 'none',
            background: getBackgroundGradient(),
            transition: 'background 0.5s ease',
        }}>
            {data && <Bar data={data} options={options as any} />}
            {countdownRef.current > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '35%',
                    left: '45%',
                    transform: 'translate(-50%, -50%)',
                    marginTop: '-20px',
                    marginLeft: '-20px',
                    padding: '20px',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    borderRadius: '8px',
                    textAlign: 'center',
                    animation: countdownRef.current <= 3 ? 'pulse 0.5s infinite' : 'none',
                    zIndex: 10,
                    fontFamily: "'Orbitron', sans-serif",  // Add this line
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'  // Optional: adds a subtle glow
                }}>
                    <div style={{ 
                        fontSize: '20px', 
                        marginBottom: '10px',
                        whiteSpace: 'nowrap',  // Add this to prevent text wrapping
                        letterSpacing: '1px'  // Add this for a more tech feel
                    }}>
                        Next Round In:
                    </div>
                    <div style={{ 
                        fontSize: '48px', 
                        fontWeight: 'bold',
                        lineHeight: 1,  // Add this to improve vertical centering
                        letterSpacing: '2px'  // Add this for a more tech feel
                    }}>
                        {countdownRef.current.toFixed(1)}s
                    </div>
                </div>
            )}
            {rugPulled && (
                <>
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    animation: 'fadeIn 0.3s ease-in'
                }} />
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#ff0000',
                    fontSize: '64px',
                    fontWeight: 'bold',
                    fontFamily: "'Orbitron', sans-serif",
                    textShadow: '0 0 20px rgba(255, 0, 0, 0.7)',
                    animation: 'dropIn 0.5s ease-out',
                    zIndex: 100,
                    textAlign: 'center',
                    letterSpacing: '4px'
                }}>
                    RUG PULLED!
                </div>
            </>
            )}
        </div>
    );
};

export default CandleChart;