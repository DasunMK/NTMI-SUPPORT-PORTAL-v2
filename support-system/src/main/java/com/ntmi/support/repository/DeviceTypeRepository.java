package com.ntmi.support.repository;

import com.ntmi.support.model.DeviceType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceTypeRepository extends JpaRepository<DeviceType, Long> {
}