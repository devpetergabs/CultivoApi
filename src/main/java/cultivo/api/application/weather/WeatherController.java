package cultivo.api.application.weather;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/weather")
public class WeatherController {
    @Autowired
    private WeatherService weatherService;

    @GetMapping
    public WeatherDTO getWeather() {
        weatherService.updateWeather();
        return new WeatherDTO(
            weatherService.getTemperature(),
            weatherService.getHumidity(),
            weatherService.getPrecipitation(),
            weatherService.getLocation()
        );
    }

    @PutMapping("/location")
    public WeatherDTO updateLocation(@RequestParam String location) {
        weatherService.setLocation(location);
        return new WeatherDTO(
            weatherService.getTemperature(),
            weatherService.getHumidity(),
            weatherService.getPrecipitation(),
            weatherService.getLocation()
        );
    }
}
