package cultivo.api.application.weather;

public class WeatherDTO {
    private Double temperature;
    private Double humidity;
    private Double precipitation;
    private String location;

    public WeatherDTO(Double temperature, Double humidity, Double precipitation, String location) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.precipitation = precipitation;
        this.location = location;
    }

    public Double getTemperature() { return temperature; }
    public Double getHumidity() { return humidity; }
    public Double getPrecipitation() { return precipitation; }
    public String getLocation() { return location; }
}
