import Particles from "@tsparticles/react";

export default function LogisticsParticles() {

  const options = {

    fullScreen: false,

    background: {
      color: "transparent"
    },

    fpsLimit: 60,

    particles: {

      number: {
        value: 120,
        density: { enable: true, area: 900 }
      },

      color: {
        value: ["#7ddf64","#34d399","#6ee7b7","#bbf7d0"]
      },

      shape: {
        type: "circle"
      },

      opacity: {
        value: 0.6
      },

      size: {
        value: { min: 2, max: 6 }
      },

      links: {
        enable: true,
        distance: 150,
        color: "#7ddf64",
        opacity: 0.35,
        width: 1
      },

      move: {
        enable: true,
        speed: 1.5,
        direction: "none",
        random: true,
        outModes: {
          default: "out"
        }
      }

    },

    interactivity: {

      events: {
        onHover: {
          enable: true,
          mode: "repulse"
        },
        onClick: {
          enable: true,
          mode: "push"
        }
      },

      modes: {

        repulse: {
          distance: 120
        },

        push: {
          quantity: 4
        }

      }

    },

    detectRetina: true

  };

  return (
    <Particles
      id="particles"
      options={options}
      style={{
        position:"absolute",
        inset:0,
        zIndex:0
      }}
    />
  );

}