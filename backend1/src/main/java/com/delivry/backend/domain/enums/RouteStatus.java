package com.delivry.backend.domain.enums;
import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "route_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
}
