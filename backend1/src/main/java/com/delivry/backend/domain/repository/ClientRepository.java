package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    Optional<Client> findByUserEmail(String email);

    // Поиск клиента по названию компании
    Optional<Client> findByCompanyNameIgnoreCase(String companyName);
}
