"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { workoutSteps, timerTypes } from "@/constants";
export default function Component() {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(workoutSteps[0].duration);
  const [isActive, setIsActive] = useState(false);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const audioContext = useRef<AudioContext | null>(null);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(
    workoutSteps.reduce((acc, step) => acc + step.duration, 0)
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [selectedTimer, setSelectedTimer] = useState("hiit");
  const [rating, setRating] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    songName: "",
    notes: "",
  });

  useEffect(() => {
    audioContext.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    return () => {
      audioContext.current?.close();
    };
  }, []);

  const playBeep = (frequency: number, duration: number) => {
    if (isSoundOn && audioContext.current) {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.current.currentTime
      );
      gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        1,
        audioContext.current.currentTime + 0.01
      );
      oscillator.start(audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.current.currentTime + duration
      );
      oscillator.stop(audioContext.current.currentTime + duration);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 5 && time > 0) {
            playBeep(440, 0.1); // Beep for last 5 seconds
          }
          return time - 1;
        });
        setTotalTimeRemaining((total) => total - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (currentStep < workoutSteps.length - 1) {
        setCurrentStep((step) => step + 1);
        setTimeLeft(workoutSteps[currentStep + 1].duration);
        playBeep(880, 0.3); // Play a different sound for new step
        focusCurrentStep(currentStep + 1);
      } else {
        setIsActive(false);
        setWorkoutComplete(true);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, currentStep, isSoundOn]);

  const startWorkout = () => {
    setIsActive(true);
  };

  const pauseWorkout = () => {
    setIsActive(false);
  };

  const resetWorkout = () => {
    setIsActive(false);
    setCurrentStep(0);
    setTimeLeft(workoutSteps[0].duration);
    setWorkoutComplete(false);
    setTotalTimeRemaining(
      workoutSteps.reduce((acc, step) => acc + step.duration, 0)
    );
    focusCurrentStep(0);
  };

  const skipToStep = (stepIndex: number) => {
    if (stepIndex < workoutSteps.length) {
      setCurrentStep(stepIndex);
      setTimeLeft(workoutSteps[stepIndex].duration);
      setTotalTimeRemaining(
        workoutSteps
          .slice(stepIndex)
          .reduce((acc, step) => acc + step.duration, 0)
      );
      if (!isActive) {
        setIsActive(true);
      }
      focusCurrentStep(stepIndex);
    }
  };

  const nextStep = () => {
    if (currentStep < workoutSteps.length - 1) {
      skipToStep(currentStep + 1);
    } else {
      setWorkoutComplete(true);
      setIsActive(false);
    }
  };

  const toggleSound = () => {
    setIsSoundOn(!isSoundOn);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const focusCurrentStep = (stepIndex: number) => {
    if (scrollContainerRef.current && stepRefs.current[stepIndex]) {
      scrollContainerRef.current.scrollTop =
        stepRefs.current[stepIndex]!.offsetTop -
        scrollContainerRef.current.offsetTop;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSaveWorkout = () => {
    console.log({
      ...formData,
      rating,
      song:
        document.getElementById("song")?.["files"]?.[0]?.name ||
        "No song selected",
    });
    setIsDialogOpen(false);
    resetWorkout();
    startWorkout();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className="w-64 bg-white border-r p-4">
        <h2 className="text-lg font-semibold mb-4">Recipes</h2>
        <ul>
          {timerTypes.map((timer) => (
            <li key={timer.id} className="mb-2">
              <Button
                variant={selectedTimer === timer.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedTimer(timer.id)}
              >
                {timer.name}
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-grow p-8 overflow-y-auto h-full">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">
            HIIT Workout Timer
          </h1>
          <p className="text-center text-gray-600 mb-4">
            Complete 10 high-intensity intervals with rest periods. Click on any
            step to skip to it.
          </p>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <span className="mr-2">
                {isSoundOn ? <Volume2 /> : <VolumeX />}
              </span>
              <Switch checked={isSoundOn} onCheckedChange={toggleSound} />
            </div>
            <div className="text-lg font-semibold">
              Remaining: {formatTime(totalTimeRemaining)}
            </div>
          </div>
          {workoutComplete ? (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-center mb-4">
                  Workout Complete!
                </h2>
                <div className="flex justify-center space-x-4">
                  <Button onClick={resetWorkout}>Start Over</Button>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Save</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Workout</DialogTitle>
                        <DialogDescription>
                          Upload a song, add notes, and rate your workout.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="song" className="text-right">
                            Song
                          </Label>
                          <Input
                            id="song"
                            type="file"
                            accept="audio/*"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="songName" className="text-right">
                            Song Name
                          </Label>
                          <Input
                            id="songName"
                            name="songName"
                            value={formData.songName}
                            onChange={handleInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="notes" className="text-right">
                            Notes
                          </Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Rating</Label>
                          <div className="flex col-span-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`cursor-pointer ${
                                  star <= rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                onClick={() => setRating(star)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleSaveWorkout}>Save Workout</Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{workoutSteps[currentStep].name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {workoutSteps[currentStep].description}
                  </p>
                  <div className="text-4xl font-bold text-center mb-4">
                    {timeLeft}s
                  </div>
                  <Progress
                    value={
                      (timeLeft / workoutSteps[currentStep].duration) * 100
                    }
                    className="w-full"
                  />
                </CardContent>
              </Card>
              <div className="flex justify-center space-x-4 mb-6">
                {!isActive ? (
                  <Button onClick={startWorkout}>
                    <Play className="mr-2 h-4 w-4" /> Start
                  </Button>
                ) : (
                  <Button onClick={pauseWorkout}>
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </Button>
                )}
                <Button onClick={resetWorkout} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" /> Start Over
                </Button>
                <Button onClick={nextStep} variant="outline">
                  <SkipForward className="mr-2 h-4 w-4" /> Next Step
                </Button>
              </div>
              <div
                ref={scrollContainerRef}
                className="space-y-4 max-h-[calc(100vh-24rem)] overflow-y-auto pr-2"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#4A5568 #EDF2F7",
                }}
              >
                {workoutSteps.map((step, index) => (
                  <div key={index} ref={(el) => (stepRefs.current[index] = el)}>
                    <Card
                      className={`
                        ${index < currentStep ? "opacity-50" : ""}
                        ${
                          index === currentStep
                            ? "border-2 border-black"
                            : "border border-transparent"
                        }
                        cursor-pointer
                        ${index !== currentStep ? "hover:border-gray-300" : ""}
                      `}
                      onClick={() => skipToStep(index)}
                    >
                      <CardHeader>
                        <CardTitle className="text-sm">{step.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-gray-600 mb-2">
                          {step.description}
                        </p>
                        <div className="text-2xl  font-semibold text-center">
                          {step.duration}s
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
