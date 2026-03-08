package com.delivry.backend.domain.enums;
import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "route_point_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoutePointStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
}
