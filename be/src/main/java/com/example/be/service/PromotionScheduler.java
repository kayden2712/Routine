package com.example.be.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PromotionScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PromotionScheduler.class);

    private final PromotionService promotionService;

    @Scheduled(cron = "0 */5 * * * *")
    public void expirePromotions() {
        logger.debug("Running scheduled task: expirePromotions");
        try {
            promotionService.expirePromotions();
        } catch (Exception e) {
            logger.error("Error expiring promotions", e);
        }
    }

    @Scheduled(cron = "0 */5 * * * *")
    public void activatePromotions() {
        logger.debug("Running scheduled task: activatePromotions");
        try {
            promotionService.activateScheduledPromotions();
        } catch (Exception e) {
            logger.error("Error activating promotions", e);
        }
    }
}
