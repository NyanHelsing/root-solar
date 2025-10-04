import RootSolarHero from "./RootSolarHero.tsx";

const backgroundImage = new URL("../../../assets/milkyway.jpg", import.meta.url).href;

export const ShellHero = () => {
    return (
        <RootSolarHero
            backgroundImage={backgroundImage}
            title="Life shares a common root."
            description="Curating a living canon of operating principles so humans and agents can coordinate with shared intent across the solar system."
        />
    );
};

export default ShellHero;
