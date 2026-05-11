package com.unihome.api.repository;

import com.unihome.api.entity.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, UUID> {
}

