import keycloak from "../configurations/keycloak";

export const logOut = () => {
    keycloak.logout();
};