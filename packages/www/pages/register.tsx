import Layout from "layouts/main";
import { withRecaptcha } from "layouts/withRecaptcha";
import Login from "../components/Site/Login";
import {
  Flex,
  Box,
  Heading,
  Text,
  Container,
  Link as A,
} from "@livepeer/design-system";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { Register as Content } from "content";
import useApi from "../hooks/use-api";
import Link from "next/link";

const emailVerificationMode =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

const shouldRecaptcha = !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const RegisterPage = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const router = useRouter();
  const { register, verify, user } = useApi();

  const { email, emailValidToken, selectedPlan } = router.query;

  useEffect(() => {
    if (email && emailValidToken) {
      verify(email, emailValidToken).then(() => {
        if (selectedPlan === "1") {
          router.replace("/dashboard/billing/plans?promptUpgrade=true");
        } else {
          router.replace("/dashboard");
        }
      });
    }
  }, [email, emailValidToken]);

  useEffect(() => {
    if (user) {
      if (emailVerificationMode && user.emailValid === false) {
        router.replace("/verify");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user]);

  const onSubmit = async ({
    email,
    password,
    firstName,
    lastName,
    organization,
    phone,
  }) => {
    if (shouldRecaptcha && !executeRecaptcha) {
      console.log("Execute recaptcha not yet available");
      return;
    }

    setLoading(true);
    setErrors([]);
    let recaptchaToken;
    if (shouldRecaptcha) {
      recaptchaToken = await executeRecaptcha("register");
    }
    const selectedPlan = router.query?.selectedPlan;
    const res = await register({
      email,
      password,
      selectedPlan: selectedPlan ? +selectedPlan : 0,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(organization && { organization }),
      ...(phone && { phone }),
      recaptchaToken,
    });
    // Don't need to worry about the success case, we'll redirect
    if (res.errors) {
      setErrors(res.errors);
      setLoading(false);
    }
  };

  return (
    <Layout {...Content.metaData}>
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$4",
            },
          }}>
          <Flex
            css={{
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              flexDirection: "column",
              py: "$5",
            }}>
            <Heading size="4" as="h1" css={{ mb: "$4" }}>
              Create an account
            </Heading>
            <Login
              id="register"
              onSubmit={onSubmit}
              showName={true}
              showOrganization={true}
              showPhone={true}
              showEmail={true}
              showPassword={true}
              buttonText="Register"
              loading={loading}
              errors={errors}
            />
            <Flex align="center" css={{ color: "$hiContrast" }}>
              Already have an account?&nbsp;
              <Link href="/login" passHref>
                <A>Log in</A>
              </Link>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

const RegisterPageWithRecaptcha: any = withRecaptcha(RegisterPage);
RegisterPageWithRecaptcha.theme = "dark-theme-blue";

export default RegisterPageWithRecaptcha;
