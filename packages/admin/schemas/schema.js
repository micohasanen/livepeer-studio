// First, we must import the schema creator
import createSchema from "part:@sanity/base/schema-creator";

// Then import schema types from any plugins that might expose them
import schemaTypes from "all:part:@sanity/base/schema-type";

// Document types
import home from "./documents/home";
import page from "./documents/page";
import job from "./documents/job";
import post from "./documents/post";
import author from "./documents/author";
import category from "./documents/category";
import useCase from "./documents/useCase";
import app from "./documents/app";
import route from "./documents/route";
import siteConfig from "./documents/siteConfig";

// Object types
import cta from "./objects/cta";
import embedHTML from "./objects/embedHTML";
import figure from "./objects/figure";
import internalLink from "./objects/internalLink";
import link from "./objects/link";
import portableText from "./objects/portableText";
import simplePortableText from "./objects/simplePortableText";
import logo from "./objects/logo";
import value from "./objects/value";
import imageExtended from "./objects/imageExtended";
import testimonial from "./objects/testimonial";
import markdownSection from "./objects/markdownSection";
import teamMember from "./objects/teamMember";
import homeHeroSection from "./objects/home/heroSection";
import homeToolkitSection from "./objects/home/toolkitSection";
import homeGuideSection from "./objects/home/guideSection";
import homeFeaturedAppSection from "./objects/home/featuredAppSection";
import homePrinciplesSection from "./objects/home/principlesSection";
import card from "./objects/card";
import localeString from "./objects/localeString";

// Landing page sections
import hero from "./objects/hero";
import valuesSection from "./objects/valuesSection";
import investorsSection from "./objects/investorsSection";
import testimonialsSection from "./objects/testimonialsSection";
import contactSection from "./objects/contactSection";
import ctaSection from "./objects/ctaSection";
import textSection from "./objects/textSection";
import teamSection from "./objects/teamSection";
import jobsSection from "./objects/jobsSection";
import why from "./objects/why";
import caseStudy from "./objects/caseStudy";
import reason from "./objects/reason";
import footer from "./objects/footer";
import application from "./objects/application";

// Then we give our schema to the builder and provide the result to Sanity
export default createSchema({
  name: "default",
  // Then proceed to concatenate our our document type
  // to the ones provided by any plugins that are installed
  types: schemaTypes.concat([
    home,
    homeHeroSection,
    homeToolkitSection,
    homeGuideSection,
    homeFeaturedAppSection,
    homePrinciplesSection,
    app,
    application,
    cta,
    embedHTML,
    figure,
    imageExtended,
    hero,
    valuesSection,
    investorsSection,
    testimonialsSection,
    contactSection,
    ctaSection,
    textSection,
    internalLink,
    value,
    testimonial,
    link,
    page,
    job,
    portableText,
    route,
    simplePortableText,
    siteConfig,
    logo,
    markdownSection,
    teamSection,
    teamMember,
    jobsSection,
    post,
    author,
    category,
    useCase,
    why,
    caseStudy,
    reason,
    card,
    footer,
    localeString,
  ]),
});
