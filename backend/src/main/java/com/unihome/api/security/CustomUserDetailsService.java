package com.unihome.api.security;

import com.unihome.api.entity.Utilisateur;
import com.unihome.api.repository.UtilisateurRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    public CustomUserDetailsService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur not found"));
        String role = utilisateur.getRole() != null ? utilisateur.getRole().name() : "USER";
        boolean enabled = !Boolean.FALSE.equals(utilisateur.getIsActive());
        // enabled=false pour un compte suspendu : bloque le login ET les JWT
        // encore valides (verifie par JwtFilter via isEnabled()).
        return new User(utilisateur.getEmail(), utilisateur.getMotDePasse(),
                enabled, true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }
}

