import type { WeatherData } from "@/lib/types";

function windDirectionLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export default function WeatherWidget({
  weather,
}: {
  weather: WeatherData | null;
}) {
  if (!weather) return null;

  const isRaining = weather.rainfall > 0;

  return (
    <div className="rounded-xl border border-f1-border bg-f1-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{isRaining ? "🌧️" : "☀️"}</span>
        <h3 className="font-bold text-sm">Track Weather</h3>
        {isRaining && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/15 px-2 py-0.5 rounded-full">
            WET
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-f1-text-muted mb-0.5">
            Air Temp
          </p>
          <p className="text-lg font-black">{weather.air_temperature.toFixed(1)}&deg;C</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-f1-text-muted mb-0.5">
            Track Temp
          </p>
          <p className="text-lg font-black">{weather.track_temperature.toFixed(1)}&deg;C</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-f1-text-muted mb-0.5">
            Humidity
          </p>
          <p className="text-sm font-bold">{weather.humidity.toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-f1-text-muted mb-0.5">
            Wind
          </p>
          <p className="text-sm font-bold">
            {weather.wind_speed.toFixed(1)} m/s {windDirectionLabel(weather.wind_direction)}
          </p>
        </div>
        {isRaining && (
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-blue-400 mb-0.5">
              Rainfall
            </p>
            <p className="text-sm font-bold text-blue-400">
              {weather.rainfall.toFixed(1)} mm
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
