import React from "react";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { services } from "../constants";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";
import { mycurrentphoto } from "../assets";

const ServiceCard = ({ index, title, icon }) => (
  <Tilt className='xs:w-[250px] w-full'>
    <motion.div
      variants={fadeIn("right", "spring", index * 0.5, 0.75)}
      className='w-full green-pink-gradient p-[1px] rounded-[20px] shadow-card'
    >
      <div
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className='bg-tertiary rounded-[20px] py-5 px-12 min-h-[280px] flex justify-evenly items-center flex-col'
      >
        <img
          src={icon}
          alt='web-development'
          className='w-16 h-16 object-contain'
        />

        <h3 className='text-white text-[20px] font-bold text-center'>
          {title}
        </h3>
      </div>
    </motion.div>
  </Tilt>
);

const About = () => {
  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Introduction</p>
        <h2 className={styles.sectionHeadText}>Overview.</h2>
      </motion.div>

      <div className='flex flex-col md:flex-row gap-10 items-center'>
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className='mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]'
        >
          I'm Akshya Kumar Sahoo, a final-year B.Tech Computer Science student specializing in Cyber Security at
          Siksha 'O' Anusandhan (ITER), Bhubaneswar. I'm passionate about building secure,
          scalable applications and solving real-world problems through technology.
          I enjoy exploring new applications, learning new tools, and keeping myself
          updated with digital trends.

          <br /><br />
          <a href="/resume.pdf" download className="bg-[#915EFF] py-3 px-8 outline-none w-fit text-white font-bold shadow-md shadow-primary rounded-xl cursor-pointer">
            Download Resume
          </a>
        </motion.p>

        <motion.div variants={fadeIn("left", "", 0.1, 1)} className="w-full md:w-[300px]">
          <Tilt className="w-full">
            <div className="w-full green-pink-gradient p-[1px] rounded-[20px] shadow-card">
              <div className="bg-tertiary rounded-[20px] overflow-hidden">
                <img src={mycurrentphoto} alt="Akshya Kumar Sahoo" className="w-full h-full object-cover" />
              </div>
            </div>
          </Tilt>
        </motion.div>
      </div>

      <div className='mt-20 flex flex-wrap gap-10'>
        {services.map((service, index) => (
          <ServiceCard key={service.title} index={index} {...service} />
        ))}
      </div>
    </>
  );
};

export default SectionWrapper(About, "about");
