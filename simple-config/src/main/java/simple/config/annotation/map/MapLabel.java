package simple.config.annotation.map;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface MapLabel {
	int sort() default Integer.MAX_VALUE;

	String icon() default "";

	boolean title() default false;
}
