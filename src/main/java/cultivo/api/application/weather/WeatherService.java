package cultivo.api.application.weather;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

@Service
public class WeatherService {
    @Value("${openweather.apikey}")
    private String apiKey;

    private String location = "Sao Paulo,BR"; // Default, can be updated

    private Double temperature;
    private Double humidity;
    private Double precipitation;

    public void updateWeather() {
        String url = String.format(
            "https://api.openweathermap.org/data/2.5/weather?q=%s&units=metric&appid=%s",
            location, apiKey
        );
        RestTemplate restTemplate = new RestTemplate();
        var response = restTemplate.getForObject(url, java.util.Map.class);
        if (response != null) {
            var main = (java.util.Map) response.get("main");
            this.temperature = main != null ? ((Number) main.get("temp")).doubleValue() : null;
            this.humidity = main != null ? ((Number) main.get("humidity")).doubleValue() : null;
            var rain = (java.util.Map) response.get("rain");
            this.precipitation = rain != null && rain.get("1h") != null ? ((Number) rain.get("1h")).doubleValue() : 0.0;
        }
    }

    public Double getTemperature() { return temperature; }
    public Double getHumidity() { return humidity; }
    public Double getPrecipitation() { return precipitation; }
    public String getLocation() { return location; }

    public void setLocation(String location) {
        this.location = location;
        updateWeather();
    }
}
