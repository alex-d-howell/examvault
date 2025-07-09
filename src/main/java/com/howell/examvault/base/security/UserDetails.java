package com.howell.examvault.base.security;

public record UserDetails(
    String email,
    String name,
    String profilePictureUrl,
    String subject
) {}