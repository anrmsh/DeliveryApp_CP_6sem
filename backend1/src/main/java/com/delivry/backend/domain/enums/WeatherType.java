package com.delivry.backend.domain.enums;

import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "weather_type")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
}
