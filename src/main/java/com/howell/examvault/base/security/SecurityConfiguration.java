package com.howell.examvault.base.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import com.vaadin.flow.spring.security.VaadinWebSecurity;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@EnableWebSecurity
@Configuration
public class SecurityConfiguration extends VaadinWebSecurity {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        System.out.println("=== Configuring Security ===");
        
        // First, apply Vaadin's default security configuration
        // This is CRUCIAL for Hilla endpoints to work properly
        super.configure(http);
        
        // Then customize with OAuth2 configuration
        http
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .defaultSuccessUrl("/home", true)  // Default redirect after OAuth2 success
                .failureUrl("/login?error=true")
                .successHandler((HttpServletRequest request, HttpServletResponse response, Authentication authentication) -> {
                    System.out.println("=== OAuth2 SUCCESS HANDLER ===");
                    System.out.println("OAuth2 login successful for user: " + authentication.getName());
                    System.out.println("Authentication type: " + authentication.getClass().getSimpleName());
                    System.out.println("Principal type: " + authentication.getPrincipal().getClass().getSimpleName());
                    System.out.println("Authorities: " + authentication.getAuthorities());
                    System.out.println("Session ID: " + request.getSession().getId());
                    
                    // Check if there's a saved redirect path in the session
                    String redirectPath = (String) request.getSession().getAttribute("redirectPath");
                    if (redirectPath != null && !redirectPath.equals("/login")) {
                        request.getSession().removeAttribute("redirectPath");
                        System.out.println("Redirecting to saved path: " + redirectPath);
                        response.sendRedirect(redirectPath);
                    } else {
                        System.out.println("No saved path, redirecting to /home");
                        response.sendRedirect("/home");
                    }
                })
                .failureHandler((HttpServletRequest request, HttpServletResponse response, org.springframework.security.core.AuthenticationException exception) -> {
                    System.out.println("=== OAuth2 FAILURE HANDLER ===");
                    System.out.println("OAuth2 login failed: " + exception.getMessage());
                    exception.printStackTrace();
                    response.sendRedirect("/login?error=true");
                })
            )
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout"))
                .logoutSuccessUrl("/login")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .clearAuthentication(true)
            );
            
        System.out.println("=== Security Configuration Complete ===");
    }
}